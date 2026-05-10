import type { ItemKey } from './content/ids';
import type { Item as ItemType } from './itemTypes';
import type { Skill } from './abilityTypes';

export interface RecipeRequirement {
  itemKey: ItemKey;
  name?: string;
  quantity: number;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  description: string;
  skill: Skill.Hand | Skill.Cooking | Skill.Smelting | Skill.Crafting;
  output: ItemType;
  ingredients: RecipeRequirement[];
  fuelOptions?: RecipeRequirement[];
}

export interface RecipeBookEntry extends RecipeDefinition {
  learned: boolean;
  favorite: boolean;
}
