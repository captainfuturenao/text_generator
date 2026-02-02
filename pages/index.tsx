import { useState, useMemo, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { templates, Template } from '@/drizzle/schema';
import { desc } from 'drizzle-orm';

interface HomeProps {
  initialTemplates: Template[];
}

function SortableItem({ template }: { template: Template }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow border-slate-200 relative group">

        {/* Drag Handle - Visible on hover */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur rounded-md cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          title="並び替え"
        >
          <GripVertical className="h-4 w-4" />
        </div>

        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
              {template.category}
            </Badge>
          </div>
          <CardTitle className="text-xl">{template.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {template.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {/* Placeholder */}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
            <Link href={`/t/${template.id}`}>
              使ってみる
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function Home({ initialTemplates }: HomeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('all');

  // Local state for templates to handle optimistic updates
  const [items, setItems] = useState(initialTemplates);

  useEffect(() => {
    setItems(initialTemplates);
  }, [initialTemplates]);

  const categories = useMemo(() => {
    const cats = new Set(initialTemplates.map(t => t.category));
    return ['all', ...Array.from(cats)];
  }, [initialTemplates]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require movement before drag starts to prevent accidental clicks
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Persist order
        fetch('/api/templates/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: newItems.map(i => ({ id: i.id })) }),
        }).catch(err => console.error('Failed to save order', err));

        return newItems;
      });
    }
  };

  const filteredTemplates = useMemo(() => {
    return items.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'all' || t.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, category]);

  const isReorderEnabled = searchTerm === '' && category === 'all';

  return (
    <>
      <Head>
        <title>Text Gen MVP</title>
        <meta name="description" content="AI Text Generation Tools" />
      </Head>

      <div className="space-y-8">
        <Card className="w-full min-h-[600px] md:h-[500px] bg-black/[0.96] relative overflow-hidden border-slate-800 flex flex-col md:flex-row">
          <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" />

          {/* Right content (Robot) - Moved to top on mobile for visibility */}
          <div className="w-full h-[350px] md:h-full md:flex-1 relative order-1 md:order-2">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>

          {/* Left content (Text) */}
          <div className="flex-1 p-8 relative z-10 flex flex-col justify-center order-2 md:order-1 bg-black/50 md:bg-transparent">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
              AI Text Generator
            </h1>
            <p className="mt-4 text-neutral-300 max-w-lg">
              テンプレートを選んで、必要な情報を入力するだけ。<br />
              AIがあなたの代わりに魅力的なテキストを生成します。
            </p>
          </div>
        </Card>

        <section className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="テンプレートを検索..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="カテゴリ" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c} value={c}>
                  {c === 'all' ? 'すべて' : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section>
          {!isReorderEnabled && (
            <p className="text-xs text-slate-400 text-right mb-2">※ 検索・絞り込み中は並び替えできません</p>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTemplates.map(t => t.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredTemplates.map((t) => (
                    isReorderEnabled ? (
                      <SortableItem key={t.id} template={t} />
                    ) : (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow border-slate-200">
                          <CardHeader>
                            <div className="flex justify-between items-start mb-2">
                              <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                                {t.category}
                              </Badge>
                            </div>
                            <CardTitle className="text-xl">{t.name}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {t.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-1">
                            {/* Placeholder */}
                          </CardContent>
                          <CardFooter>
                            <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                              <Link href={`/t/${t.id}`}>
                                使ってみる
                              </Link>
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    )
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              条件に一致するテンプレートが見つかりませんでした。
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const allTemplates = await db.select().from(templates).orderBy(desc(templates.displayOrder), desc(templates.createdAt)).all();

  const serializableTemplates = allTemplates.map(t => ({
    ...t,
    createdAt: t.createdAt?.toISOString() || null,
    updatedAt: t.updatedAt?.toISOString() || null,
  }));

  return {
    props: {
      initialTemplates: serializableTemplates,
    },
  };
};
