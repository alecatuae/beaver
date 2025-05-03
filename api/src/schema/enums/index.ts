import { builder } from '../index';

// Enums para o schema GraphQL

// Status de componente
export const Status = builder.enumType('Status', {
  values: ['PLANNED', 'ACTIVE', 'DEPRECATED'] as const,
});

// Status de ADR
export const ADRStatus = builder.enumType('ADRStatus', {
  values: ['DRAFT', 'ACCEPTED', 'SUPERSEDED', 'REJECTED'] as const,
});

// Papéis de usuário
export const Role = builder.enumType('Role', {
  values: ['ADMIN', 'ARCHITECT', 'CONTRIBUTOR', 'VIEWER'] as const,
});

// Papéis de participante em ADR
export const ParticipantRole = builder.enumType('ParticipantRole', {
  values: ['OWNER', 'REVIEWER', 'CONSUMER'] as const,
});

// Status de item de roadmap
export const RoadmapStatus = builder.enumType('RoadmapStatus', {
  values: ['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const,
});

// Níveis de impacto para ADR em instâncias
export const ImpactLevel = builder.enumType('ImpactLevel', {
  values: ['LOW', 'MEDIUM', 'HIGH'] as const,
});

// Status de termos do glossário
export const GlossaryStatus = builder.enumType('GlossaryStatus', {
  values: ['DRAFT', 'APPROVED', 'DEPRECATED'] as const,
});

// Níveis de log
export const LogLevel = builder.enumType('LogLevel', {
  values: ['INFO', 'WARN', 'ERROR'] as const,
}); 