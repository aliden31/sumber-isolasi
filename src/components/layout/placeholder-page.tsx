import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">{title}</h1>
      <Card className="flex-1">
        <CardContent className="h-full flex flex-col items-center justify-center gap-4 text-center p-10">
            <Construction className="w-16 h-16 text-muted-foreground" />
            <div className="space-y-2">
                <h2 className="text-xl font-semibold font-headline">Fitur Dalam Pengembangan</h2>
                <p className="text-muted-foreground max-w-xl">{description}</p>
                 <p className="text-sm text-muted-foreground pt-4">Halaman ini adalah placeholder dan akan diimplementasikan dengan fungsionalitas penuh di masa mendatang.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
