/**
 * Stato del form di login, tenuto fuori da actions.ts di proposito:
 * un file "use server" puo esportare solo funzioni async, quindi la costante
 * iniziale non puo vivere li (Next fallisce a runtime, non in compilazione).
 */
export type SignInState = { error: string | null };

export const initialSignInState: SignInState = { error: null };
