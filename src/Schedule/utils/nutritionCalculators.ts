import type { LaneTemplate, TemplateMap } from '@tannerbroberts/about-time-core';

export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

export function calculateLaneNutrition(laneId: string, templates: TemplateMap): NutritionTotals {
  const totals: NutritionTotals = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0,
  };

  const lane = templates[laneId] as LaneTemplate | undefined;
  if (!lane) {
    return totals;
  }

  const traverseSegment = (segmentId: string): void => {
    const segment = templates[segmentId];
    if (!segment) {
      // eslint-disable-next-line no-console
      console.warn(`Missing template for segment: ${segmentId}`);
      return;
    }

    if (segment.templateType === 'busy' && segment.willProduce) {
      totals.calories += segment.willProduce.calories || 0;
      totals.protein_g += segment.willProduce.protein_g || 0;
      totals.carbs_g += segment.willProduce.carbs_g || 0;
      totals.fats_g += segment.willProduce.fats_g || 0;
    }

    if (segment.templateType === 'lane' && segment.segments) {
      segment.segments.forEach((seg) => traverseSegment(seg.templateId));
    }
  };

  lane.segments?.forEach((segment) => traverseSegment(segment.templateId));

  return totals;
}
