import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '../api/clients'

export const useNotificationSettings = () => {
  const [vkEnabled, setVkEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data } = await getSettings()

      setVkEnabled(!!data.vk_notify)
      setEmailEnabled(!!data.email_notify)
      setEmail(data.email || '')
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (
    nextVk: boolean,
    nextEmail: boolean,
    nextEmailValue: string
  ) => {
    await updateSettings({
      vk_notify: nextVk,
      email_notify: nextEmail,
      email: nextEmailValue,
      notify_day_before: true,
      notify_hour_before: true,
      vk_id: null,
    })

    setVkEnabled(nextVk)
    setEmailEnabled(nextEmail)
    setEmail(nextEmailValue)
  }

  return {
    vkEnabled,
    emailEnabled,
    email,
    setEmail,
    saveSettings,
    isLoading,
  }
}