import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Defect, getDefect } from "../api/defectsApi";

export function DefectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [defect, setDefect] = useState<Defect | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;

    getDefect(id)
      .then((result) => {
        if (!cancelled) {
          setDefect(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Unable to load this defect.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loadError) {
    return <p role="alert">{loadError}</p>;
  }

  if (!defect) {
    return <p role="status">Loading…</p>;
  }

  return (
    <div className="defect-detail-page">
      <h1>{defect.title}</h1>
      <dl>
        <dt>Description</dt>
        <dd>{defect.description}</dd>

        <dt>Severity</dt>
        <dd>{defect.severity}</dd>

        <dt>Priority</dt>
        <dd>{defect.priority}</dd>

        <dt>Reporter</dt>
        <dd>{defect.reporter}</dd>

        {defect.component && (
          <>
            <dt>Component</dt>
            <dd>{defect.component}</dd>
          </>
        )}

        {defect.assignee && (
          <>
            <dt>Assignee</dt>
            <dd>{defect.assignee}</dd>
          </>
        )}

        {defect.attachments.length > 0 && (
          <>
            <dt>Attachments</dt>
            <dd>
              <ul>
                {defect.attachments.map((attachment) => (
                  <li key={attachment}>{attachment}</li>
                ))}
              </ul>
            </dd>
          </>
        )}

        {defect.screenshots.length > 0 && (
          <>
            <dt>Screenshots</dt>
            <dd>
              <ul>
                {defect.screenshots.map((screenshot) => (
                  <li key={screenshot}>{screenshot}</li>
                ))}
              </ul>
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}
