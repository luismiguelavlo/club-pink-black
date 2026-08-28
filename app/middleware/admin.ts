export default defineNuxtRouteMiddleware(async () => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/login')
  }

  if (user.value?.role !== 'admin') {
    return navigateTo('/dashboard')
  }
})
