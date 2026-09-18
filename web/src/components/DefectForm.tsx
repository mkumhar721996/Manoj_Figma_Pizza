import { FormEvent, useId, useState } from "react";
import { NewDefectInput, PRIORITIES, ProjectMember, SEVERITIES } from "../api/defectsApi";
import "./DefectForm.css";

export type DefectFormErrors = Record<string, string>;

interface DefectFormState {
  title: string;
  description: string;
  severity: string;
  priority: string;
  reporter: string;
  component: string;
  assignee: string;
  attachments: string[];
  screenshots: string[];
}

const INITIAL_STATE: DefectFormState = {
  title: "",
  description: "",
  severity: "",
  priority: "",
  reporter: "",
  component: "",
  assignee: "",
  attachments: [],
  screenshots: [],
};

const FIELD_LABELS = {
  title: "Title",
  description: "Description",
  severity: "Severity",
  priority: "Priority",
  reporter: "Reporter",
} satisfies Record<string, string>;

type RequiredField = keyof typeof FIELD_LABELS;

const REQUIRED_FIELDS: RequiredField[] = ["title", "description", "severity", "priority", "reporter"];

function validate(state: DefectFormState): DefectFormErrors {
  const errors: DefectFormErrors = {};

  for (const field of REQUIRED_FIELDS) {
    if (state[field].trim().length === 0) {
      errors[field] = `${FIELD_LABELS[field]} is required`;
    }
  }

  return errors;
}

function toNewDefectInput(state: DefectFormState): NewDefectInput {
  return {
    title: state.title.trim(),
    description: state.description.trim(),
    severity: state.severity,
    priority: state.priority,
    reporter: state.reporter.trim(),
    component: state.component.trim() || undefined,
    assignee: state.assignee.trim() || undefined,
    attachments: state.attachments,
    screenshots: state.screenshots,
  };
}

export interface DefectFormProps {
  onSubmit: (input: NewDefectInput) => void | Promise<void>;
  isSubmitting?: boolean;
  serverErrors?: DefectFormErrors;
  projectMembers?: ProjectMember[];
}

export function DefectForm({
  onSubmit,
  isSubmitting = false,
  serverErrors = {},
  projectMembers = [],
}: DefectFormProps) {
  const [values, setValues] = useState<DefectFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<DefectFormErrors>({});
  const formId = useId();

  const allErrors: DefectFormErrors = { ...errors, ...serverErrors };

  function updateField<K extends keyof DefectFormState>(field: K, value: DefectFormState[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    Promise.resolve(onSubmit(toNewDefectInput(values))).catch((error: unknown) => {
      console.error("[DefectForm] onSubmit rejected", error);
    });
  }

  function fieldProps(field: RequiredField) {
    const inputId = `${formId}-${field}`;
    const errorId = `${inputId}-error`;
    const hasError = Boolean(allErrors[field]);

    return {
      id: inputId,
      "aria-required": true,
      "aria-invalid": hasError,
      "aria-describedby": hasError ? errorId : undefined,
    } as const;
  }

  function renderError(field: RequiredField) {
    if (!allErrors[field]) {
      return null;
    }
    return (
      <p id={`${formId}-${field}-error`} className="defect-form__error" role="alert">
        {allErrors[field]}
      </p>
    );
  }

  return (
    <form className="defect-form" onSubmit={handleSubmit} noValidate>
      <div className="defect-form__field">
        <label htmlFor={`${formId}-title`}>Title</label>
        <input
          {...fieldProps("title")}
          type="text"
          value={values.title}
          onChange={(event) => updateField("title", event.target.value)}
        />
        {renderError("title")}
      </div>

      <div className="defect-form__field">
        <label htmlFor={`${formId}-description`}>Description</label>
        <textarea
          {...fieldProps("description")}
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
        {renderError("description")}
      </div>

      <div className="defect-form__field">
        <label htmlFor={`${formId}-severity`}>Severity</label>
        <select
          {...fieldProps("severity")}
          value={values.severity}
          onChange={(event) => updateField("severity", event.target.value)}
        >
          <option value="">Select severity</option>
          {SEVERITIES.map((severity) => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </select>
        {renderError("severity")}
      </div>

      <div className="defect-form__field">
        <label htmlFor={`${formId}-priority`}>Priority</label>
        <select
          {...fieldProps("priority")}
          value={values.priority}
          onChange={(event) => updateField("priority", event.target.value)}
        >
          <option value="">Select priority</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
        {renderError("priority")}
      </div>

      <div className="defect-form__field">
        <label htmlFor={`${formId}-reporter`}>Reporter</label>
        <select
          {...fieldProps("reporter")}
          value={values.reporter}
          onChange={(event) => updateField("reporter", event.target.value)}
        >
          <option value="">Select reporter</option>
          {projectMembers.map((member) => (
            <option key={member.id} value={member.name}>
              {member.name}
            </option>
          ))}
        </select>
        {renderError("reporter")}
      </div>

      <div className="defect-form__field">
        <label htmlFor={`${formId}-component`}>Component (optional)</label>
        <input
          id={`${formId}-component`}
          type="text"
          value={values.component}
          onChange={(event) => updateField("component", event.target.value)}
        />
      </div>

      <div className="defect-form__field">
        <label htmlFor={`${formId}-assignee`}>Assignee (optional)</label>
        <select
          id={`${formId}-assignee`}
          value={values.assignee}
          onChange={(event) => updateField("assignee", event.target.value)}
        >
          <option value="">Unassigned</option>
          {projectMembers.map((member) => (
            <option key={member.id} value={member.name}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      <div className="defect-form__field">
        <label htmlFor={`${formId}-attachments`}>Attachments (optional)</label>
        <input
          id={`${formId}-attachments`}
          type="file"
          multiple
          onChange={(event) =>
            updateField("attachments", Array.from(event.target.files ?? []).map((file) => file.name))
          }
        />
      </div>

      <div className="defect-form__field">
        <label htmlFor={`${formId}-screenshots`}>Screenshots (optional)</label>
        <input
          id={`${formId}-screenshots`}
          type="file"
          multiple
          accept="image/*"
          onChange={(event) =>
            updateField("screenshots", Array.from(event.target.files ?? []).map((file) => file.name))
          }
        />
      </div>

      <div className="defect-form__actions">
        <button type="submit" disabled={isSubmitting}>
          Create Defect
        </button>
      </div>
    </form>
  );
}
