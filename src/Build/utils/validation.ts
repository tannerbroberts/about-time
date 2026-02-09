interface TemplateFormData {
  name: string;
  durationMinutes: number;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fats_g?: number;
  prep_time?: number;
  cost?: number;
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

  // Optional fields - only validate if provided
  if (formData.calories !== undefined && formData.calories < 0) {
    errors.calories = 'Calories cannot be negative';
  }

  if (formData.protein_g !== undefined && formData.protein_g < 0) {
    errors.protein_g = 'Protein cannot be negative';
  }

  if (formData.carbs_g !== undefined && formData.carbs_g < 0) {
    errors.carbs_g = 'Carbs cannot be negative';
  }

  if (formData.fats_g !== undefined && formData.fats_g < 0) {
    errors.fats_g = 'Fats cannot be negative';
  }

  if (formData.prep_time !== undefined && formData.prep_time < 0) {
    errors.prep_time = 'Prep time cannot be negative';
  }

  if (formData.cost !== undefined && formData.cost < 0) {
    errors.cost = 'Cost cannot be negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
