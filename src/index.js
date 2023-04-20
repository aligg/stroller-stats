import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import ErrorPage from './routes/error-page';
import Home from "./routes/home"
import React from 'react';
import Redirect from './routes/redirect';
import Root from './routes/root';
import { createRoot } from 'react-dom/client';
import firebase from "./utils/firebase"

const container = document.getElementById('root');
const root = createRoot(container);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    // loader: homeLoader,  
  },
  {
    path: 'redirect/exchange_token',
    element: <Redirect/>
}, {
    path: "/home",
    element: <Home />,
    errorElement: <ErrorPage />,
}
  
]);

root.render(
    <RouterProvider router={router} fallbackElement={<div>Loading</div>}/>
);
