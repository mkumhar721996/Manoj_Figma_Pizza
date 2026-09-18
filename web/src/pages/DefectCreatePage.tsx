import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DefectForm } from "../components/DefectForm";
import { createDefect, DefectApiError, getProjectMembers, NewDefectInput, ProjectMember } from "../api/defectsApi";

export function DefectCreatePage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);

  useEffect(() => {
    let cancelled = false;

    getProjectMembers()
      .then((members) => {
        if (!cancelled) {
          setProjectMembers(members);
        }
      })
      .catch((error: unknown) => {
        console.error("[DefectCreatePage] failed to load project members", error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(input: NewDefectInput) {
    setIsSaving(true);
    setServerErrors({});

    try {
      const created = await createDefect(input);
      navigate(`/defects/${created.id}`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (error instanceof DefectApiError) {
        setServerErrors(error.errors);
        return;
      }
      console.error("[DefectCreatePage] failed to create defect", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="defect-create-page">
      <h1>Create Defect</h1>
      <DefectForm
        onSubmit={handleSubmit}
        isSubmitting={isSaving}
        serverErrors={serverErrors}
        projectMembers={projectMembers}
      />
      {isSaving && <span role="status">Saving…</span>}
    </div>
  );
}
