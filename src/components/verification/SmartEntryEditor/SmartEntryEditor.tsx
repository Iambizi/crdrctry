import React, { useState } from 'react';
import styles from './SmartEntryEditor.module.scss';

interface FormData {
  name: string;
  nationality?: string;
  is_active?: boolean;
  [key: string]: string | boolean | undefined;
}

interface SmartEntryEditorProps {
  data: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
}

export const SmartEntryEditor = ({ data, onSave, onCancel }: SmartEntryEditorProps) => {
  const [formData, setFormData] = useState(data);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name !== undefined && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.nationality !== undefined && !formData.nationality.trim()) {
      newErrors.nationality = 'Nationality is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = <T extends string | boolean>(field: string, value: T) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <div className={styles.editor}>
      <h3>Edit Entry</h3>
      <form onSubmit={handleSubmit}>
        {Object.entries(data).map(([field, value]) => {
          if (typeof value === 'boolean') {
            return (
              <div key={field} className={styles.field}>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(formData[field])}
                    onChange={e => handleChange(field, e.target.checked)}
                  />
                  {field.replace(/_/g, ' ')}
                </label>
                {errors[field] && <span className={styles.error}>{errors[field]}</span>}
              </div>
            );
          }

          return (
            <div key={field} className={styles.field}>
              <label>{field.replace(/_/g, ' ')}</label>
              <input
                type="text"
                value={typeof formData[field] === 'string' ? formData[field] as string : ''}
                onChange={e => handleChange(field, e.target.value)}
                className={errors[field] ? styles.hasError : ''}
              />
              {errors[field] && <span className={styles.error}>{errors[field]}</span>}
            </div>
          );
        })}

        <div className={styles.actions}>
          <button type="button" onClick={onCancel} className={styles.cancel}>
            Cancel
          </button>
          <button type="submit" className={styles.save}>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
