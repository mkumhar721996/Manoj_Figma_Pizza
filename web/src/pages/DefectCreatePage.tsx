import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DefectForm } from "../components/DefectForm";
import { createDefect, DefectApiError, NewDefectInput } from "../api/defectsApi";

export function DefectCreatePage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

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
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="defect-create-page">
      <h1>Create Defect</h1>
      <DefectForm onSubmit={handleSubmit} isSubmitting={isSaving} serverErrors={serverErrors} />
      {isSaving && <span role="status">Saving…</span>}
    </div>
  );
}
