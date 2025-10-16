
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { promises as fs } from 'fs';
import path from 'path';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


// This is a simplified markdown parser.
// For a real app, you would use a library like 'marked' or 'react-markdown'.
function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' = 'ul';

  lines.forEach((line, index) => {
    if (line.startsWith('## ')) {
      elements.push(<h2 key={index} className="text-2xl font-headline font-semibold mt-8 mb-4 border-b pb-2">{line.substring(3)}</h2>);
      inList = false;
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-xl font-headline font-semibold mt-6 mb-3">{line.substring(4)}</h3>);
      inList = false;
    } else if (line.startsWith('1.  ') || line.startsWith('*   ')) {
        const isOrdered = line.startsWith('1.  ');
        if (!inList || (isOrdered && listType === 'ul') || (!isOrdered && listType === 'ol')) {
            inList = true;
            listType = isOrdered ? 'ol' : 'ul';
            elements.push(React.createElement(listType, { key: `list-${index}`, className: `ml-6 space-y-2 list-${isOrdered ? 'decimal' : 'disc'}` }));
        }
        const listElement = elements[elements.length - 1] as React.ReactElement;
        const newChildren = [...(listElement.props.children || []), <li key={index}>{line.substring(4)}</li>];
        elements[elements.length - 1] = React.cloneElement(listElement, {}, newChildren);

    } else if (line.startsWith('> ')) {
       elements.push(<blockquote key={index} className="mt-6 border-l-2 pl-6 italic">{line.substring(2)}</blockquote>);
       inList = false;
    } else if (line.trim() === '---') {
        elements.push(<hr key={index} className="my-8" />);
        inList = false;
    } else if (line.trim() === '') {
        elements.push(<div key={index} className="h-4"></div>);
        inList = false;
    }
    else {
      inList = false;
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
      elements.push(
        <p key={index} className="text-muted-foreground leading-relaxed">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
            }
            if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={i} className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">{part.slice(1, -1)}</code>;
            }
            return part;
          })}
        </p>
      );
    }
  });

  return <>{elements}</>;
}


export default async function PanduanPage() {
  const blueprintPath = path.join(process.cwd(), 'src/app/blueprint.md');
  let blueprintContent = '';
  try {
    blueprintContent = await fs.readFile(blueprintPath, 'utf8');
  } catch (error) {
    console.error("Could not read blueprint.md:", error);
    blueprintContent = "# Gagal memuat panduan\nTidak dapat menemukan file `blueprint.md`.";
  }

  const sections = blueprintContent.split('---');
  const finishedFeaturesSection = sections[0];
  const inDevelopmentFeaturesSection = sections[1];
  const flutterPromptSection = sections[2];
  const usageGuideSection = sections[3];
  const accountingFlowSection = sections[4];


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-headline font-bold">Panduan & Blueprint Aplikasi</h1>
      <Card>
        <CardHeader>
          <CardTitle>Dokumentasi Sistem</CardTitle>
          <CardDescription>
            Panduan ini berisi informasi mengenai fitur, alur kerja akuntansi, dan prompt teknis untuk pengembangan lebih lanjut.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-semibold">Panduan Penggunaan Aplikasi</AccordionTrigger>
                    <AccordionContent className="prose prose-sm max-w-none">
                         <SimpleMarkdown content={usageGuideSection} />
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-2">
                    <AccordionTrigger className="text-lg font-semibold">Status Pengembangan Fitur</AccordionTrigger>
                    <AccordionContent className="prose prose-sm max-w-none">
                         <SimpleMarkdown content={finishedFeaturesSection} />
                         <SimpleMarkdown content={inDevelopmentFeaturesSection} />
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger className="text-lg font-semibold">Alur Integrasi Akuntansi</AccordionTrigger>
                    <AccordionContent className="prose prose-sm max-w-none">
                       <SimpleMarkdown content={accountingFlowSection} />
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-4">
                    <AccordionTrigger className="text-lg font-semibold">Prompt Generate Aplikasi Mobile (Flutter)</AccordionTrigger>
                    <AccordionContent className="prose prose-sm max-w-none">
                       <SimpleMarkdown content={flutterPromptSection} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
