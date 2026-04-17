import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mocking the DiagnosticSchema from server.js
const DiagnosticSchema = z.object({
  errorCode: z.string(),
  errorName: z.string().optional(),
  severity: z.enum(['critical', 'warning', 'info']),
  diagnosis: z.string(),
  commands: z.array(z.object({
    label: z.string(),
    command: z.string()
  })).min(1),
  explanation: z.string()
});

describe('Diagnostic Schema Validation', () => {
  it('should pass valid diagnostic data', () => {
    const validData = {
      errorCode: '0x1',
      severity: 'info',
      diagnosis: 'Test diagnosis',
      commands: [{ label: 'test', command: 'echo test' }],
      explanation: 'Detailed explanation'
    };
    const result = DiagnosticSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail if commands are empty', () => {
    const invalidData = {
      errorCode: '0x1',
      severity: 'info',
      diagnosis: 'Test',
      commands: [],
      explanation: 'Test'
    };
    const result = DiagnosticSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should fail on invalid severity', () => {
    const invalidData = {
      errorCode: '0x1',
      severity: 'UNKNOWN_LEVEL',
      diagnosis: 'Test',
      commands: [{ label: 't', command: 'c' }],
      explanation: 'Test'
    };
    const result = DiagnosticSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
