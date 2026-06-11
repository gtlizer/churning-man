export const CAMP_MEMBERS = [
  'Amandaa',
  'Andrew',
  'Anna',
  'Brenna',
  'Clover',
  'Eli',
  'Evan',
  'Gabe',
  'George',
  'Joe',
  'Kevin',
  'Keza',
  'Leo',
  'Matt',
  'Natalie',
  'Nick',
] as const

export type CampMember = (typeof CAMP_MEMBERS)[number]
