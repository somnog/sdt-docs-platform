# SomNOG Next.js Frontend: Basic Setup Guide

Copy-and-paste guide for the `example` frontend. It uses the same folders and the same code style as the `example` project. Every code block is a complete file: the heading above it is the path, create the file and paste the whole block.

The code was type-checked and built with `next build` against the versions below. It has **not** been run against a live backend, so the first login (step 8) is the real test.

**Versions:** Node 24, Next.js 16.3.5, React 19.2.8, Ant Design 6.6.4, Ant Design Pro Components 3.1.14-7, axios 1.20.

---

## Contents

1. [What you are building](#1-what-you-are-building)
2. [Before you start](#2-before-you-start)
3. [Create the Next.js app](#3-create-the-nextjs-app)
4. [Install the packages](#4-install-the-packages)
5. [Folder structure](#5-folder-structure)
6. [The code, file by file](#6-the-code-file-by-file)
7. [How the pieces connect](#7-how-the-pieces-connect)
8. [Run it and test](#8-run-it-and-test)
9. [Add your own page](#9-add-your-own-page)
10. [Troubleshooting](#10-troubleshooting)
11. [Checklist](#11-checklist)

---

## 1. What you are building

One Next.js app that talks to **one** backend address, the gateway. Behind the gateway are several services, but the frontend never sees them.

```text
Browser (Next.js, port 3004)
        |   HTTP + JSON
        v
Gateway (port 3000, every route starts with /api)
        |   RabbitMQ
        v
auth-service | events-service | notification-service
```

Two rules:

- The only backend address in your code is `http://localhost:3000/api`, set once in `shared/ipconfig.ts`.
- Each team works only in its own folder under `packages/`.

---

## 2. Before you start

| You need | Check with |
|---|---|
| Node.js 20.9 or newer | `node -v` |
| The backend running | open `http://localhost:3000/api/docs` (Swagger opens = gateway is up) |

To start the backend, from the `backend` folder:

```bash
npm run infra:up      # postgres, rabbitmq, redis, mailhog (needs Docker)
npm run dev           # gateway + the 3 services
```

---

## 3. Create the Next.js app

```bash
npx create-next-app@latest example --yes
cd example
```

`--yes` takes the defaults: TypeScript, ESLint, Tailwind CSS, App Router, and the import alias `@/*`. `@/` means "start from the project root", so `@/shared/ipconfig` is the file `shared/ipconfig.ts`.

### Change the port

The gateway already uses port 3000, and `next dev` also uses 3000 by default. Move Next.js to **3004**. In `package.json`, change the `dev` line:

```json
"scripts": {
  "dev": "next dev -p 3004",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

---

## 4. Install the packages

```bash
npm install antd@6 @ant-design/pro-components@beta @ant-design/icons axios
```

| Package | What for |
|---|---|
| `antd` | Ant Design 6 components (message, tabs, theme) |
| `@ant-design/pro-components` | The ready-made `LoginForm` |
| `@ant-design/icons` | Icons in the login form |
| `axios` | Calls the gateway |

> **Use `@beta` for pro-components.**
> Without it, npm installs version 2.8.10, which only supports Ant Design 4 and 5, and stops with an `ERESOLVE` error when you use `antd@6`. The `beta` tag is 3.1.14-7, which supports Ant Design 6.

> **Remove `i` and `npm` if they are in your `package.json`.**
> They look like accidental installs and nothing uses them: `npm uninstall i npm`.

---

## 5. Folder structure

Same as the `example` folder. `*` marks a file you create or change.

```text
example/
├── package.json                      * dev script uses port 3004
├── app/                              pages (routes)
│   ├── layout.tsx                    (from create-next-app, no change)
│   ├── page.tsx                      * "/" shows the login form
│   ├── globals.css
│   └── dashboard/
│       ├── layout.tsx                * wraps the dashboard in <AuthProvider>
│       ├── page.tsx                  * /dashboard
│       └── events/
│           └── page.tsx              * /dashboard/events
├── shared/
│   └── ipconfig.ts                   * the axios instance
└── packages/
    ├── auth/
    │   ├── context/
    │   │   └── context.tsx           * AuthProvider + useAuth()
    │   └── login/
    │       └── login.tsx             * sign in / sign up form
    └── events/                       (Events team puts their screens here)
```

Create the folders:

```bash
mkdir -p shared packages/auth/context packages/auth/login packages/events app/dashboard/events
```

Who works where:

| Folder | Team |
|---|---|
| `packages/auth` | Auth team |
| `packages/events` | Events team |
| `shared/`, `app/` | Everyone. Tell the others before you change a file here |

---

## 6. The code, file by file

Order: `ipconfig.ts`, `context.tsx`, `login.tsx`, then the pages.

### 6.1 `shared/ipconfig.ts`

The one axios instance. Every package imports this. Nobody creates a second one.

```ts
import axios from "axios"


const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Send the login token with every request (needed for protected routes)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


export default api
```

What changed from the example:

- `baseURL` now ends with `/api`. The gateway answers only under `/api`, so without it every call is a 404. Because of this, in your code you write `api.get("/events")`, not `api.get("/api/events")`.
- The `interceptors.request.use(...)` block is new. It adds the login token to every request, so protected routes work later.

### 6.2 `packages/auth/context/context.tsx`

The `AuthProvider` and the `useAuth()` hook. Any page inside the provider can call `useAuth()` to get the signed-in user.

```tsx
"use client"
import {useContext, createContext, useState,  useEffect} from 'react';

interface AuthContextType {
  user: any;
  isloggedIn: boolean;
  setUser: React.Dispatch<React.SetStateAction<any>>;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  logout: () => void;
}
const AuthContext = createContext({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState(null);
    const [isloggedIn, setIsLoggedIn] = useState(false);
  

    useEffect(() => {
        // Check if the user is logged in by checking local storage or cookies
        const storedUser = localStorage.getItem('user');
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsLoggedIn(true);
        }
    }, []);

    const logout = () => {
        // Clear user data from local storage or cookies
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        setIsLoggedIn(false);
    }
  const authValue = { user, isloggedIn, setUser, setIsLoggedIn, logout }; // You can add your authentication logic here

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}
```

What changed from the example (three small edits):

| Line | Before | After | Why |
|---|---|---|---|
| interface | no `logout` | added `logout: () => void;` | So `logout` is part of the type |
| `createContext` | `createContext({})` | `createContext({} as AuthContextType)` | With `{}`, TypeScript says `Property 'user' does not exist` in the events page |
| `authValue` | no `logout` | added `logout` | `logout` was written but nobody could call it |

Everything else is the same. The user is restored from `localStorage` when the provider first loads, so a page refresh keeps you signed in.

### 6.3 `packages/auth/login/login.tsx`

The sign in / sign up form (Ant Design Pro `LoginForm`).

```tsx
"use client"
import {
  AlipayCircleOutlined,
  LockOutlined,
  MobileOutlined,
  TaobaoCircleOutlined,
  UserOutlined,
  WeiboCircleOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProConfigProvider,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
  setAlpha,
} from '@ant-design/pro-components';
import { Space, Tabs, message, theme } from 'antd';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/shared/ipconfig';

type LoginType = 'signin' | 'signup';

const Demo = () => {
  const { token } = theme.useToken();
  const router = useRouter();
  const [loginType, setLoginType] = useState<LoginType>('signin');

  const iconStyles: CSSProperties = {
    marginInlineStart: '16px',
    color: setAlpha(token.colorTextBase, 0.2),
    fontSize: '24px',
    verticalAlign: 'middle',
    cursor: 'pointer',
  };

  const onFinish = async (values: any) => {
    try {
      if (loginType === 'signin') {
        // 1. ask the gateway to log us in
        const { data } = await api.post('/auth/login', {
          email: values.email,
          password: values.password,
        });
        // 2. keep the tokens and the user, AuthProvider reads them later
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        // 3. go to the dashboard
        router.push('/dashboard');
      } else {
        await api.post('/auth/register', {
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
        });
        message.success('Account created, please sign in');
        setLoginType('signin');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || 'Something went wrong');
    }
  }

  return (
    <ProConfigProvider hashed={false}>
      <div style={{ backgroundColor: token.colorBgContainer }}>
        <LoginForm
          logo="https://github.githubassets.com/favicons/favicon.png"
          title="Github"
          subTitle="Signin or Signup"
          onFinish={onFinish}
        >
          <Tabs
            centered
            activeKey={loginType}
            onChange={(activeKey) => setLoginType(activeKey as LoginType)}
            items={[
              { key: 'signin', label: 'Sign in' },
              { key: 'signup', label: 'Sign up' },
            ]}
          />
          {loginType === 'signin' && (
            <>
              <ProFormText
                name="email"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={'prefixIcon'} />,
                }}
                placeholder={'enter email'}
                rules={[
                  {
                    required: true,
                    message: 'please enter email!',
                  },
                ]}
              />

              <ProFormText.Password
                name="password"
                
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={'prefixIcon'} />,
                }}
                placeholder={'enter password'}
                rules={[
                  {
                    required: true,
                    message: 'please enter password!',
                  },
                ]}
              />
              
            </>
          )}
          {loginType === 'signup' && (
            <>
              <ProFormText
                name="firstName"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={'prefixIcon'} />,
                }}
                placeholder={'enter Firstname'}
                rules={[
                  {
                    required: true,
                    message: 'please enter Firstname!',
                  },
                ]}
              />
               <ProFormText
                name="lastName"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={'prefixIcon'} />,
                }}
                placeholder={'enter Lastname'}
                rules={[
                  {
                    required: true,
                    message: 'please enter Lastname!',
                  },
                ]}
              />

              <ProFormText
                name="email"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={'prefixIcon'} />,
                }}
                placeholder={'enter email'}
                rules={[
                  {
                    required: true,
                    message: 'please enter email!',
                  },
                ]}
              />
              

              <ProFormText.Password
                name="password"
                
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={'prefixIcon'} />,
                }}
                placeholder={'enter password'}
                rules={[
                  {
                    required: true,
                    message: 'please enter password!',
                  },
                ]}
              />
              
            </>
          )}
          <div
            style={{
              marginBlockEnd: 24,
            }}
          >
            <ProFormCheckbox noStyle name="autoLogin">
              自动登录
            </ProFormCheckbox>
            <a
              style={{
                float: 'right',
              }}
            >
              忘记密码
            </a>
          </div>
        </LoginForm>
      </div>
    </ProConfigProvider>
  );
};

export default () => (
  <div style={{ padding: 24 }}>
    <Demo />
  </div>
);
```

What changed from the example:

| Before | After | Why |
|---|---|---|
| `onFinish` only did `console.log(values)` | Sends `POST /auth/login`, saves the result, goes to `/dashboard` | The form now really logs in |
| `name="username"` | `name="email"` | The API needs `email` and rejects unknown fields with a 400 |
| `type LoginType = 'sigin' \| 'signup'` | `'signin' \| 'signup'` | Typo. It was a TypeScript error |
| Sign up did nothing | Sends `POST /auth/register`, then switches to the Sign in tab | Sign up works |
| New imports | `useRouter` and `api` | Needed by the new `onFinish` |

The rest of the file is unchanged. (The Chinese labels `自动登录` and `忘记密码` mean "auto login" and "forgot password". Translate them if you like.)

What login saves in `localStorage`:

| Key | Value |
|---|---|
| `accessToken` | Sent with every request. Expires after 15 minutes |
| `refreshToken` | Lasts 7 days |
| `user` | The signed-in user: `id`, `email`, `firstName`, `lastName`, `role` ... |

### 6.4 `app/page.tsx`

Unchanged. It only shows the login form.

```tsx
import Login from "@/packages/auth/login/login";
import Image from "next/image";

export default function Home() {
  return (
    <>
    <Login />
    </>
  );
}
```

### 6.5 `app/dashboard/layout.tsx` (where `AuthProvider` goes)

Unchanged. This is where `AuthProvider` is wrapped: around everything inside `/dashboard`.

```tsx

import {AuthProvider} from '@/packages/auth/context/context';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div >
            <AuthProvider>
            {children}
            </AuthProvider>
        
        </div>
    );
    }
```

Why the login page can stay outside the provider: after login, the form saves the user in `localStorage` and moves to `/dashboard`. `AuthProvider` starts there and reads the user back from `localStorage`.

Wrap `AuthProvider` **once only**. Do not add another one in a page.

### 6.6 `app/dashboard/page.tsx`

Unchanged.

```tsx
function DashboardPage() {
    return (
        <div>
            <h1>Dashboard Page</h1>
            <p>This is the dashboard page content.</p>
        </div>
    );
}

export default DashboardPage;
```

### 6.7 `app/dashboard/events/page.tsx`

Same page as the example (it still calls `useAuth()` and logs the user). It now also loads the events from the gateway and lists their titles.

```tsx
"use client"
import { useEffect, useState } from "react";
import api from "@/shared/ipconfig";
import { useAuth } from "@/packages/auth/context/context";

function EventsPage() {
    const {user,isloggedIn} = useAuth();
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        // GET http://localhost:3000/api/events  (public route)
        api.get("/events").then((res) => setEvents(res.data.items));
    }, []);

    console.log("User from Auth Context:", user,isloggedIn); // Log the user object to the console
  return (
    <div>
      <h1>Events Page</h1>
      <p>Hello {user?.firstName}</p>
      <ul>
        {events.map((event) => (
          <li key={event.id}>{event.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default EventsPage;
```

What was added:

- `api.get("/events")` calls `GET http://localhost:3000/api/events`. This route is public, so it works without a token.
- The response looks like `{ items: [...], meta: {...} }`, so the list is `res.data.items`.

---

## 7. How the pieces connect

Login, step by step:

```text
1. You type email + password on "/"            packages/auth/login/login.tsx
2. api.post("/auth/login", { email, password }) shared/ipconfig.ts
      -> POST http://localhost:3000/api/auth/login
3. The gateway checks it with auth-service
4. Response: { accessToken, refreshToken, expiresIn, user }
5. login.tsx saves accessToken, refreshToken and user in localStorage
6. router.push("/dashboard")
7. AuthProvider (in dashboard/layout.tsx) starts, reads "user" from localStorage,
   and calls setUser(...) and setIsLoggedIn(true)
8. Any page can now call useAuth() to get { user, isloggedIn }
9. Later api.get(...) calls carry  Authorization: Bearer <accessToken>
```

### When does a file need `"use client"`?

Put `"use client"` on the first line of any file that uses React hooks (`useState`, `useEffect`, `useContext`, `useRouter`) or the browser (`localStorage`). That is why `context.tsx`, `login.tsx` and the events page have it.

---

## 8. Run it and test

1. Backend running (`http://localhost:3000/api/docs` opens).
2. In the frontend folder:

   ```bash
   npm run dev
   ```

3. Open `http://localhost:3004`. You see the login form.
4. Sign in with a seeded account (local development only):

   | Role | Email | Password |
   |---|---|---|
   | ADMIN | admin@somnog.so | Admin12345 |
   | ORGANIZER | organizer@somnog.so | Organizer12345 |
   | SPEAKER | speaker@somnog.so | Speaker12345 |
   | ATTENDEE | attendee@somnog.so | Attendee12345 |

5. You land on `/dashboard`.
6. Open `http://localhost:3004/dashboard/events`. You see the event titles, and in the browser console (F12, Console tab) the line `User from Auth Context: {...} true`.
7. Check DevTools, Application tab, Local Storage: `accessToken`, `refreshToken` and `user` are there.

Try **Sign up** too: fill first name, last name, email and a password of at least 8 characters. You get "Account created, please sign in".

---

## 9. Add your own page

Same pattern as the events page. Example: a tickets page.

**1.** Create `app/dashboard/tickets/page.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react";
import api from "@/shared/ipconfig";

function TicketsPage() {
    const [tickets, setTickets] = useState<any[]>([]);

    useEffect(() => {
        // Protected route: the token is added by shared/ipconfig.ts
        api.get("/me/registrations").then((res) => setTickets(res.data.items ?? res.data));
    }, []);

    return (
        <div>
            <h1>My Tickets</h1>
            <pre>{JSON.stringify(tickets, null, 2)}</pre>
        </div>
    );
}

export default TicketsPage;
```

**2.** Open `http://localhost:3004/dashboard/tickets`.

Check the response shape of any route in Swagger (`http://localhost:3000/api/docs`) before you build the screen. Use the **Authorize** button there to paste an access token for protected routes.

Common calls (paths are relative to `/api`):

```ts
api.get("/events", { params: { page: 1, limit: 10 } })   // GET  /api/events?page=1&limit=10
api.get(`/events/${slug}`)                                // one event
api.post(`/events/${id}/registrations`, body)             // register (needs login)
api.patch(`/registrations/${id}/cancel`)                  // cancel
```

Main routes:

| Area | Routes |
|---|---|
| Auth | `POST /auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`; `GET /auth/me` |
| Events (public) | `GET /events`, `/events/:slug`, `/categories` |
| Registrations | `POST /events/:id/registrations`; `GET /me/registrations`; `PATCH /registrations/:id/cancel` |
| Notifications | `GET /me/notifications` |
| Organiser (ADMIN, ORGANIZER) | `GET /manage/events`; `POST /events`; `POST /registrations/:code/check-in` |
| Admin | `GET /auth/users`; `POST /categories` |

Lists come back as `{ items: [...], meta: { page, limit, total, totalPages } }`.

---

## 10. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Every request is 404 | Missing `/api` | `baseURL` in `shared/ipconfig.ts` must end with `/api` |
| `npm install` fails: `ERESOLVE ... peer antd@"^4.24.15 \|\| ^5.11.2"` | `pro-components` installed without `@beta` | `npm install @ant-design/pro-components@beta` |
| Frontend opens on port 3000, or `EADDRINUSE :3000` | Clash with the gateway | `"dev": "next dev -p 3004"` |
| Login shows "property username should not exist" | Field is named `username` | Use `name="email"` |
| Login shows a network error | Gateway is not running | Open `http://localhost:3000/api/docs` |
| `Property 'user' does not exist on type '{}'` | Old `createContext({})` | Use `createContext({} as AuthContextType)` (step 6.2) |
| `Type '"signin"' is not assignable...` | Typo `'sigin'` | Fix it in `LoginType` (step 6.3) |
| `useAuth` gives `user` = `null` on the dashboard | Not signed in, or the page is outside the provider | Sign in first; keep the page under `app/dashboard/` |
| `localStorage is not defined` | Code ran on the server | Put `"use client"` on the first line, and use `localStorage` only inside `useEffect` or click/submit handlers |
| 401 on a protected route | Token missing or expired (15 minutes) | Sign in again; keep the interceptor in `ipconfig.ts` |
| 403 Forbidden | Your role cannot use that route | Sign in as ADMIN or ORGANIZER |
| `Cannot find name 'LayoutProps'` | Next's generated types are missing | Run `npx next typegen`, or start `npm run dev` once |
| Strange behaviour after moving files | Old build cache | Stop the server, delete the `.next` folder, run `npm run dev` |

---

## 11. Checklist

- [ ] Backend running (`/api/docs` opens)
- [ ] App created, dev script uses port 3004
- [ ] Packages installed, with `@ant-design/pro-components@beta`
- [ ] `ipconfig.ts` base URL ends with `/api`
- [ ] `context.tsx`, `login.tsx` and `events/page.tsx` replaced with the versions above
- [ ] Login works and the three keys appear in Local Storage
- [ ] `/dashboard/events` lists the seeded events
- [ ] You only edited your own `packages/<name>` folder

### Not included (on purpose, to keep it simple)

- **No sign-out button.** `logout` exists in `useAuth()`; call it from any button. It clears the three `localStorage` keys.
- **No route guard.** Opening `/dashboard` while signed out shows the page with `user = null`. The real security is in the gateway, which rejects requests without a valid token.
- **No automatic token refresh.** After 15 minutes the token expires; sign in again.
- Tokens live in `localStorage`, which JavaScript on the page can read. Fine for a course project; a real product would use server-set `httpOnly` cookies.
