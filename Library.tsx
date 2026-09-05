import { useEffect, useMemo, useState } from "react";
import { EmptyEditorial, PageHeader, PageLoading, SectionMark } from "@/components/EditorialUI";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { fileSize, formatDate } from "@/lib/format";
import { fileToBase64 } from "@/lib/files";
import { BookOpen, ExternalLink, FileText, Link2, Plus, Search, UploadCloud } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 50;

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState("");
  const [sectionId, setSectionId] = useState("todos");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [itemTheme, setItemTheme] = useState("");
  const [itemSection, setItemSection] = useState("geral");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [page, setPage] = useState(1);
  const filters = useMemo(() => ({
    search: search || undefined,
    theme: theme || undefined,
    sectionId: sectionId === "todos" ? undefined : Number(sectionId),
  }), [search, theme, sectionId]);
  const { data, isLoading } = trpc.library.list.useQuery(filters);
  const { data: sections } = trpc.dashboard.sections.useQuery();
  const utils = trpc.useUtils();
  const addLink = trpc.library.addLink.useMutation();
  const upload = trpc.library.upload.useMutation();
  const themes = useMemo(() => Array.from(new Set((data ?? []).map(item => item.theme).filter(Boolean))) as string[], [data]);
  const totalPages = Math.max(1, Math.ceil((data?.length ?? 0) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = useMemo(
    () => (data ?? []).slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [currentPage, data]
  );

  useEffect(() => setPage(1), [search, sectionId, theme]);

  const reset = () => { setTitle(""); setDescription(""); setItemTheme(""); setItemSection("geral"); setExternalUrl(""); setFile(null); };
  const saveLink = async () => {
    if (!title || !externalUrl) { toast.error("Informe título e URL."); return; }
    try {
      await addLink.mutateAsync({ title, externalUrl, description: description || null, theme: itemTheme || null, sectionId: itemSection === "geral" ? null : Number(itemSection) });
      await utils.library.list.invalidate(); toast.success("Referência adicionada."); reset(); setOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível adicionar."); }
  };
  const saveFile = async () => {
    if (!title || !file) { toast.error("Informe título e selecione um arquivo."); return; }
    try {
      const base64 = await fileToBase64(file);
      await upload.mutateAsync({ title, description: description || null, theme: itemTheme || null, sectionId: itemSection === "geral" ? null : Number(itemSection), file: { fileName: file.name, mimeType: file.type || "application/octet-stream", fileSize: file.size, base64 } });
      await utils.library.list.invalidate(); toast.success("Arquivo armazenado na biblioteca."); reset(); setOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível enviar."); }
  };

  if (isLoading || !data) return <PageLoading />;
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Documentação de apoio"
        title="Biblioteca de referências"
        description="Consulta e organização de arquivos e links por tema e pelas 30 frentes da Apresentação e dos Tomos I a IV."
        index="05 — Biblioteca"
        action={
          <Button onClick={() => setOpen(true)} className="rounded-md">
            <Plus className="mr-2 h-4 w-4" /> Nova referência
          </Button>
        }
      />
      <div className="technical-panel grid gap-3 p-4 lg:grid-cols-[1fr_230px_230px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar título, descrição ou tema"
            className="bg-background pl-10"
          />
        </div>
        <Select value={sectionId} onValueChange={setSectionId}>
          <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as seções</SelectItem>
            {sections?.map(section => <SelectItem value={String(section.id)} key={section.id}>{section.code}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={theme || "todos"} onValueChange={value => setTheme(value === "todos" ? "" : value)}>
          <SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os temas</SelectItem>
            {themes.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="data-label self-center text-right">{data.length} referências</p>
      </div>
      {data.length === 0 ? (
        <EmptyEditorial title="Nenhuma referência cadastrada" text="Cadastre uma referência ou altere os filtros de busca." />
      ) : (
        <div className="technical-panel overflow-hidden">
          <div className="data-label hidden grid-cols-[96px_minmax(0,1fr)_210px_120px_100px] gap-4 border-b bg-muted/55 px-4 py-3 md:grid">
            <span>Tipo / frente</span>
            <span>Referência</span>
            <span>Tema</span>
            <span>Registro</span>
            <span className="text-right">Ação</span>
          </div>
          <div className="divide-y paper-rule">
            {visibleItems.map(item => (
              <article key={item.id} className="grid gap-3 px-4 py-3.5 hover:bg-muted/35 md:grid-cols-[96px_minmax(0,1fr)_210px_120px_100px] md:items-center">
                <div className="flex items-center gap-2 md:block">
                  <div className="flex items-center gap-2 text-primary">
                    {item.itemType === "arquivo" ? <FileText className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                    <span className="data-label text-primary">{item.itemType}</span>
                  </div>
                  <div className="mt-0 md:mt-2">
                    {item.sectionCode ? <SectionMark code={item.sectionCode} /> : <span className="data-label">geral</span>}
                  </div>
                </div>
                <div>
                  <h2 className="text-sm font-semibold leading-5">{item.title}</h2>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {item.description || "Referência catalogada para consulta da equipe."}
                  </p>
                  {item.fileName ? <p className="font-mono mt-1 truncate text-[10px] text-muted-foreground">{item.fileName}</p> : null}
                </div>
                <div>
                  <p className="data-label md:hidden">Tema</p>
                  <p className="mt-1 text-xs font-medium leading-5 md:mt-0">{item.theme || "Sem tema"}</p>
                </div>
                <div>
                  <p className="data-label md:hidden">Registro</p>
                  <p className="font-mono mt-1 text-[11px] text-muted-foreground md:mt-0">
                    {item.itemType === "arquivo" ? fileSize(item.fileSize) : formatDate(item.createdAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-md md:justify-self-end"
                  onClick={() => window.open(item.itemType === "link" ? item.externalUrl ?? "#" : item.storageUrl ?? "#", "_blank", "noopener,noreferrer")}
                >
                  {item.itemType === "arquivo" ? <BookOpen className="mr-1.5 h-3.5 w-3.5" /> : <ExternalLink className="mr-1.5 h-3.5 w-3.5" />} Abrir
                </Button>
              </article>
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/30 px-4 py-3">
              <p className="font-mono text-[11px] text-muted-foreground">
                Página {currentPage} de {totalPages} · itens {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, data.length)} de {data.length}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage(value => Math.max(1, value - 1))}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))}>Próxima</Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-semibold tracking-[-.03em]">Adicionar referência</DialogTitle>
            <DialogDescription>Registro de link ou envio de documento para a biblioteca do estudo.</DialogDescription>
          </DialogHeader>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Título</Label><Input className="mt-2" value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label>Tema</Label><Input className="mt-2" value={itemTheme} onChange={e => setItemTheme(e.target.value)} placeholder="Ex.: políticas industriais" /></div>
            <div><Label>Seção</Label><Select value={itemSection} onValueChange={setItemSection}><SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="geral">Referência geral</SelectItem>{sections?.map(section => <SelectItem key={section.id} value={String(section.id)}>{section.code}</SelectItem>)}</SelectContent></Select></div>
            <div className="sm:col-span-2"><Label>Descrição</Label><Textarea className="mt-2" value={description} onChange={e => setDescription(e.target.value)} /></div>
          </div>
          <Tabs defaultValue="arquivo" className="mt-5">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="arquivo">Arquivo</TabsTrigger><TabsTrigger value="link">Link</TabsTrigger></TabsList>
            <TabsContent value="arquivo" className="mt-5">
              <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/35 p-6 text-center">
                <UploadCloud className="h-6 w-6 text-primary" />
                <span className="mt-3 text-sm font-semibold">{file?.name || "Selecionar documento"}</span>
                <span className="mt-1 text-xs text-muted-foreground">PDF, Word, planilhas e apresentações · até 20 MB</span>
                <input className="sr-only" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.odt,.ods,.odp" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </label>
              <Button onClick={saveFile} disabled={upload.isPending} className="mt-4 w-full">{upload.isPending ? "Enviando…" : "Armazenar na nuvem"}</Button>
            </TabsContent>
            <TabsContent value="link" className="mt-5">
              <Label>URL da referência</Label>
              <Input type="url" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://" className="mt-2" />
              <Button onClick={saveLink} disabled={addLink.isPending} className="mt-4 w-full">Adicionar link</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
