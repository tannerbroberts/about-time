interface TemplateFormData {
  name: string;
  durationMinutes: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateTemplateForm = (formData: TemplateFormData): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!formData.name || formData.name.trim() === '') {
    errors.name = 'Name is required';
  }

  if (!formData.durationMinutes || formData.durationMinutes <= 0) {
    errors.durationMinutes = 'Duration must be greater than 0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
