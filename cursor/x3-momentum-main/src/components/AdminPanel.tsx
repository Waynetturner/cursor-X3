
import React, { useState } from 'react';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminTestEmail } from './AdminTestEmail';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export const AdminPanel = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h2>
        <p className="text-gray-600">Manage users and system settings</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="email">Email Testing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <AdminUserManagement />
        </TabsContent>
        
        <TabsContent value="email" className="space-y-4">
          <AdminTestEmail />
        </TabsContent>
      </Tabs>
    </div>
  );
};
