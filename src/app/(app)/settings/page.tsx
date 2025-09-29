import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCompanySettings, CompanySettings } from './actions';
import { SettingsForm } from './settings-form';

export default async function SettingsPage() {
  const settings = await getCompanySettings();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Pengaturan</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Profil Perusahaan</CardTitle>
          <CardDescription>
            Atur informasi dasar mengenai usaha Anda. Informasi ini akan digunakan pada struk dan laporan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm initialData={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
