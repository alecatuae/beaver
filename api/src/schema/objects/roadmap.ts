import { builder } from '../index';
import { RoadmapStatus } from '../enums';

// Tipo GraphQL para RoadmapType
export const RoadmapType = builder.prismaObject('RoadmapType', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    colorHex: t.exposeString('colorHex'),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    
    // Relações
    items: t.relation('items'),
  }),
});

// Tipo GraphQL para RoadmapItem
export const RoadmapItem = builder.prismaObject('RoadmapItem', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    description: t.exposeString('description', { nullable: true }),
    componentId: t.exposeInt('componentId', { nullable: true }),
    typeId: t.exposeInt('typeId'),
    status: t.expose('status', { type: RoadmapStatus }),
    dueDate: t.expose('dueDate', { type: 'Date', nullable: true }),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    
    // Relações
    component: t.relation('component', { nullable: true }),
    type: t.relation('type'),
  }),
});

// Input para criação de tipo de roadmap
export const RoadmapTypeInput = builder.inputType('RoadmapTypeInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string({ required: false }),
    colorHex: t.string({ required: true }),
  }),
});

// Input para criação de item de roadmap
export const RoadmapItemInput = builder.inputType('RoadmapItemInput', {
  fields: (t) => ({
    title: t.string({ required: true }),
    description: t.string({ required: false }),
    componentId: t.int({ required: false }),
    typeId: t.int({ required: true }),
    status: t.field({
      type: RoadmapStatus,
      required: false,
      defaultValue: 'TODO',
    }),
    dueDate: t.field({
      type: 'Date',
      required: false,
    }),
  }),
});

// Input para atualização de item de roadmap
export const RoadmapItemUpdateInput = builder.inputType('RoadmapItemUpdateInput', {
  fields: (t) => ({
    title: t.string({ required: false }),
    description: t.string({ required: false }),
    componentId: t.int({ required: false }),
    typeId: t.int({ required: false }),
    status: t.field({
      type: RoadmapStatus,
      required: false,
    }),
    dueDate: t.field({
      type: 'Date',
      required: false,
    }),
  }),
});

// Input para filtrar tipos de roadmap
export const RoadmapTypeWhereInput = builder.inputType('RoadmapTypeWhereInput', {
  fields: (t) => ({
    id: t.int({ required: false }),
    name: t.string({ required: false }),
  }),
});

// Input para filtrar itens de roadmap
export const RoadmapItemWhereInput = builder.inputType('RoadmapItemWhereInput', {
  fields: (t) => ({
    id: t.int({ required: false }),
    title: t.string({ required: false }),
    componentId: t.int({ required: false }),
    typeId: t.int({ required: false }),
    status: t.field({
      type: RoadmapStatus,
      required: false,
    }),
  }),
}); 