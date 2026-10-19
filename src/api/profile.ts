import { api } from './client'
import type { AvatarUpdate, PasswordChange, Profile, ProfileUpdate } from './types'

export function getProfile(signal?: AbortSignal) {
  return api.get<Profile>('/profile', { signal }).then((r) => r.data)
}

export function updateProfile(input: ProfileUpdate) {
  return api.patch<Profile>('/profile', input).then((r) => r.data)
}

export function updateAvatar(input: AvatarUpdate) {
  return api.post<Profile>('/profile/avatar', input).then((r) => r.data)
}

export function changePassword(input: PasswordChange) {
  return api.post<void>('/profile/password', input).then(() => undefined)
}
