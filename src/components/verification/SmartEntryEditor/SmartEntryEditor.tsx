import React, { useState } from 'react';
import { useCombobox } from 'downshift';
import { useQuery } from '@tanstack/react-query';
import styles from './SmartEntryEditor.module.scss';

type Designer = {
  id: string;
  name: string;
  nationality?: string;
};

const NATIONALITIES = [
  'American', 'British', 'French', 'Italian', 'Japanese',
  'German', 'Spanish', 'Belgian', 'Dutch', 'Danish',
  'Swedish', 'Norwegian', 'Chinese', 'Korean', 'Brazilian',
  // Add more as needed
];

interface FormData {
  name: string;
  nationality?: string;
  is_active?: boolean;
  relationships?: Array<{
    type: 'mentorship' | 'succession' | 'collaboration' | 'familial';
    designer: string;
  }>;
  [key: string]: string | boolean | undefined | Array<{
    type: 'mentorship' | 'succession' | 'collaboration' | 'familial';
    designer: string;
  }>;
}

interface SmartEntryEditorProps {
  data: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
}

async function searchDesigners(query: string): Promise<Designer[]> {
  // TODO: Replace with actual API call
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { id: '1', name: 'John Galliano', nationality: 'British' },
        { id: '2', name: 'Marc Jacobs', nationality: 'American' },
        // Add more mock data
      ].filter(d => d.name.toLowerCase().includes(query.toLowerCase())));
    }, 300);
  });
}

export function SmartEntryEditor({ data, onSave, onCancel }: SmartEntryEditorProps) {
  const [formData, setFormData] = useState<FormData>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState('');

  const { data: suggestions = [] } = useQuery({
    queryKey: ['designers', inputValue],
    queryFn: () => searchDesigners(inputValue),
    enabled: inputValue.length > 2,
  });

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
  } = useCombobox({
    items: suggestions,
    onInputValueChange: ({ inputValue }) => {
      setInputValue(inputValue || '');
    },
    itemToString: (item) => item?.name || '',
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        setFormData(prev => ({
          ...prev,
          name: selectedItem.name,
          nationality: selectedItem.nationality || prev.nationality
        }));
      }
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (formData.nationality && !NATIONALITIES.includes(formData.nationality)) {
      newErrors.nationality = 'Please select a valid nationality';
    }

    if (formData.relationships) {
      formData.relationships.forEach((rel, index) => {
        if (!rel.designer) {
          newErrors[`relationship_${index}`] = 'Designer is required for relationship';
        }
        if (!rel.type) {
          newErrors[`relationship_type_${index}`] = 'Relationship type is required';
        }
      });
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
    if (validateForm()) {
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
              <div key={field} className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={Boolean(formData[field])}
                    onChange={e => handleChange(field, e.target.checked)}
                  />
                  <span>{field.replace(/_/g, ' ')}</span>
                </label>
              </div>
            );
          }

          return field === 'name' ? (
            <div key={field}>
              <label>Designer Name</label>
              <div className={styles.autocomplete}>
                <input
                  {...getInputProps({
                    placeholder: 'Search for a designer...',
                    className: errors.name ? styles.hasError : ''
                  })}
                />
                <ul {...getMenuProps()} className={styles.suggestions}>
                  {isOpen && suggestions.map((item, index) => (
                    <li
                      key={item.id}
                      {...getItemProps({ item, index })}
                      className={`
                        ${styles.suggestion}
                        ${highlightedIndex === index ? styles.highlighted : ''}
                      `}
                    >
                      <span>{item.name}</span>
                      {item.nationality && (
                        <span className={styles.nationality}>{item.nationality}</span>
                      )}
                    </li>
                  ))}
                  {isOpen && !suggestions.length && inputValue.length > 2 && (
                    <li className={styles.noResults}>No results found</li>
                  )}
                </ul>
              </div>
              {errors.name && <div className={styles.error}>{errors.name}</div>}
            </div>
          ) : field === 'nationality' ? (
            <div key={field}>
              <label>Nationality</label>
              <select
                value={formData.nationality || ''}
                onChange={e => handleChange(field, e.target.value)}
                className={errors.nationality ? styles.hasError : ''}
              >
                <option value="">Select nationality...</option>
                {NATIONALITIES.map(nat => (
                  <option key={nat} value={nat}>{nat}</option>
                ))}
              </select>
              {errors.nationality && (
                <div className={styles.error}>{errors.nationality}</div>
              )}
            </div>
          ) : (
            <div key={field}>
              <label>{field.replace(/_/g, ' ')}</label>
              <input
                type="text"
                value={typeof formData[field] === 'string' ? formData[field] as string : ''}
                onChange={e => handleChange(field, e.target.value)}
                className={errors[field] ? styles.hasError : ''}
              />
              {errors[field] && (
                <div className={styles.error}>{errors[field]}</div>
              )}
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
