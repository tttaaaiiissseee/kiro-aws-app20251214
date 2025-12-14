import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import ServiceList from '../pages/ServiceList';
import ServiceDetail from '../pages/ServiceDetail';
import RelationMap from '../pages/RelationMap';
import Comparison from '../pages/Comparison';
import CategoryManagement from '../pages/CategoryManagement';

// Define routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <ServiceList />,
      },
      {
        path: 'services',
        element: <ServiceList />,
      },
      {
        path: 'services/new',
        element: <ServiceDetail />,
      },
      {
        path: 'services/:id',
        element: <ServiceDetail />,
      },
      {
        path: 'services/:id/edit',
        element: <ServiceDetail />,
      },
      {
        path: 'relations',
        element: <RelationMap />,
      },
      {
        path: 'comparison',
        element: <Comparison />,
      },
      {
        path: 'categories',
        element: <CategoryManagement />,
      },
    ],
  },
]);

// Router component
export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;