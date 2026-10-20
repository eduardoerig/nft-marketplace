import { createFileRoute } from '@tanstack/react-router'
import { AccountFormSkeleton, AccountLoadError } from '@/features/account/components/account-states'
import { PasswordForm } from '@/features/account/components/password-form'
import { ProfileForm } from '@/features/account/components/profile-form'
import { profileQueryOptions, useProfile } from '@/features/account/queries'

export const Route = createFileRoute('/_auth/account/profile')({
  // Começa a buscar já na navegação; a sessão vem do beforeLoad de _auth.tsx.
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(profileQueryOptions(context.session.user.id))
  },
  head: () => ({ meta: [{ title: 'Perfil do colecionador — Kurio' }] }),
  component: ProfilePage,
})

function ProfilePage() {
  const { data: profile, error, isPending, refetch } = useProfile()

  return (
    <section aria-labelledby="perfil-titulo" className="flex flex-col gap-6">
      <h1 id="perfil-titulo" className="text-base font-bold">
        Perfil do colecionador
      </h1>
      {isPending ? (
        <AccountFormSkeleton label="Carregando perfil" />
      ) : error ? (
        <AccountLoadError error={error} onRetry={() => refetch()} />
      ) : (
        <>
          {/* key: se o perfil mudar por fora (outra aba), o formulário recomeça com os dados novos. */}
          <ProfileForm key={profile.id} profile={profile} />
          <PasswordForm />
        </>
      )}
    </section>
  )
}
