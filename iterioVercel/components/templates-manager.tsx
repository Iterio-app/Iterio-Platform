import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import TemplateCustomizer from "@/components/template-customizer";
import TemplateErrorAlert from "@/components/template-error-alert";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

export default function TemplatesManager({
  user,
  templates,
  loadingTemplates,
  errorTemplates,
  fetchTemplates,
  handleNewTemplate,
  handleEditTemplate,
  handleSaveTemplate,
  handleDeleteTemplate,
  showTemplateModal,
  setShowTemplateModal,
  editingTemplate,
  setEditingTemplate,
  templateForm,
  setTemplateForm,
  isSavingTemplateModal,
  showDeleteConfirm,
  setShowDeleteConfirm,
  templateToDelete,
  setTemplateToDelete,
  validationErrors = [],
  templateError = null,
  onDismissError,
}: any) {
  // ✅ Hacer fetch cuando el componente se monta (usuario va a la tab de templates)
  useEffect(() => {
    fetchTemplates()
  }, [])

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Mostrar errores de template */}
      <TemplateErrorAlert error={templateError} onDismiss={onDismissError} />
      
      <div className="bg-white rounded-lg shadow p-6 min-h-[200px] flex flex-col gap-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Mis Templates</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTemplates(true)}
              disabled={loadingTemplates}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loadingTemplates ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button disabled={templates.length >= 5} onClick={handleNewTemplate} className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-400/70 to-blue-600/70 hover:from-blue-500/80 hover:to-blue-700/80">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Template
            </Button>
          </div>
        </div>
        {loadingTemplates ? (
          <div className="text-center text-gray-400">Cargando templates...</div>
        ) : errorTemplates ? (
          <div className="text-center text-red-500">{errorTemplates}</div>
        ) : templates.length === 0 ? (
          <div className="text-center text-gray-400">No tienes templates guardados.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {templates.map((tpl: any) => (
              <div key={tpl.id} className="flex items-center gap-4 border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition">
                {/* Preview visual - Simplificado porque no tenemos template_data en la lista */}
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center border border-gray-200 bg-white shadow-sm"
                >
                  <span className="text-2xl font-bold text-gray-400">📄</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lg text-gray-900 truncate">
                    {tpl.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    Creado: {new Date(tpl.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="border border-gray-200" onClick={() => handleEditTemplate(tpl)}>
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button size="icon" variant="ghost" className="border border-gray-200 hover:bg-red-50" onClick={() => { setShowDeleteConfirm(true); setTemplateToDelete(tpl); }}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Formulario stacked debajo del listado */}
      {(showTemplateModal || editingTemplate) && (
        <div className="mt-8 bg-white rounded-lg shadow p-6 max-w-6xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">{editingTemplate ? "Editar Template" : "Nuevo Template"}</h3>
          <div className="mb-4">
            <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del template</label>
            <input
              id="template-name"
              type="text"
              className={`w-full border rounded px-3 py-2 text-base ${
                validationErrors.some((e: any) => e.field === 'name') ? 'border-red-500' : ''
              }`}
              placeholder="Ej: Viajes a Europa"
              value={templateForm?.name || ''}
              onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
              maxLength={50}
            />
            {validationErrors.some((e: any) => e.field === 'name') && (
              <p className="text-red-500 text-sm mt-1">
                {validationErrors.find((e: any) => e.field === 'name')?.message}
              </p>
            )}
          </div>
          {templateForm && (
            <TemplateCustomizer
              template={templateForm}
              onTemplateChange={setTemplateForm}
            />
          )}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSaveTemplate} disabled={isSavingTemplateModal} className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-400/70 to-blue-600/70 hover:from-blue-500/80 hover:to-blue-700/80">
              {isSavingTemplateModal ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="outline" onClick={() => { setShowTemplateModal(false); setEditingTemplate(null); setTemplateForm(null); }} className="px-4 py-2 text-sm font-medium border border-gray-200 bg-white/70 hover:bg-gray-50/80">
              Cancelar
            </Button>
          </div>
        </div>
      )}
      {/* Confirmación de borrado */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar template?</DialogTitle>
          </DialogHeader>
          <p>Esta acción no se puede deshacer.</p>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDeleteTemplate}>Eliminar</Button>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 