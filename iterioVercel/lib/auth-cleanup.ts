import { supabase } from './supabase'

/**
 * Performs a complete logout by clearing all authentication data
 * including Supabase session, localStorage, sessionStorage, and cookies
 */
export async function completeLogout() {
  try {
    // Sign out from Supabase with global scope
    await supabase.auth.signOut({ scope: 'global' })
  } catch (error) {
    console.error('Error signing out from Supabase:', error)
  }

  // Clear all browser storage
  if (typeof window !== 'undefined') {
    // Clear localStorage
    localStorage.clear()
    
    // Clear sessionStorage
    sessionStorage.clear()
    
    // Clear all cookies
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
      
      // Clear cookie for current path
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
      
      // Clear cookie for all subdomains
      const domain = window.location.hostname
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${domain}`
      
      // Clear cookie for parent domain
      const parentDomain = domain.split('.').slice(-2).join('.')
      if (parentDomain !== domain) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${parentDomain}`
      }
    })
  }
}

/**
 * Checks if there are any authentication tokens stored
 */
export function hasStoredAuth() {
  if (typeof window === 'undefined') return false
  
  // Check localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (key.includes('supabase') || key.includes('auth'))) {
      return true
    }
  }
  
  // Check sessionStorage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && (key.includes('supabase') || key.includes('auth'))) {
      return true
    }
  }
  
  // Check cookies
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name] = cookie.trim().split('=')
    if (name && (name.includes('supabase') || name.includes('auth'))) {
      return true
    }
  }
  
  return false
}
