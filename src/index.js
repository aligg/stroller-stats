import React, { StrictMode } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';

import ErrorPage from './routes/error-page';
import Home from './routes/home';
import Redirect from './routes/redirect';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');
const root = createRoot(container);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <ErrorPage />,
    // loader: homeLoader,
  },{
      path: '/redirect/exchange_token',
      element: <Redirect/>
  }
]);

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
