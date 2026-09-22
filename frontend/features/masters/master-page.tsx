'use client';
import { useState } from 'react';
import { Tabs } from '@/components/ui/navigation';
import { RemoteSelect } from '@/components/admin/remote-select';
import { Card } from '@/components/ui/surfaces';
import { Button } from '@/components/ui/button';
import { ResourceManager } from './resource-manager';
import { resources, optionConfig, associationConfig } from './config';
export function MasterPage({ resource }: {
    resource: string;
}) { const [tab, setTab] = useState('definitions'), [selected, setSelected] = useState<Record<string, unknown> | null>(null), [category, setCategory] = useState(''); const config = resources[resource]!; return <>{resource === 'atributos' && <Tabs value={tab} onChange={setTab} items={[{ id: 'definitions', label: 'Definiciones y opciones' }, { id: 'associations', label: 'Asociaciones a categorías' }]}/>}{tab === 'associations' ? <><Card title="Categoría"><p className="muted">Una asociación define qué atributo usa la categoría, si es requerido y su orden.</p><RemoteSelect path="/admin/categories" label="Categoría" value={category} onChange={id => setCategory(id)}/></Card>{category && <ResourceManager key={category} config={associationConfig(category)} compact/>}</> : selected ? <><Button className="button-secondary" onClick={() => setSelected(null)}>← Volver a definiciones</Button><p>Opciones de <strong>{String(selected.name)}</strong>. El valor identifica la opción; el nombre es visible al administrador.</p><ResourceManager key={String(selected.id)} config={optionConfig(String(selected.id))} compact/></> : <ResourceManager config={config} onExtra={resource === 'atributos' ? row => setSelected(row) : undefined}/>}</>; }
