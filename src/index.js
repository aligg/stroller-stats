import './index.css';

import App from "./App";
import React from 'react';
import { createRoot } from 'react-dom/client';
import firebase from "./utils/firebase"

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    <App />
)