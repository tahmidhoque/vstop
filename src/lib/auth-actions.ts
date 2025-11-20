'use server'

import { deleteSession, updateCustomerPassword as updateCustomerPasswordInternal } from './auth'

export async function logoutAction() {
  await deleteSession()
}

export async function updateCustomerPassword(newPassword: string): Promise<void> {
  return updateCustomerPasswordInternal(newPassword)
}

