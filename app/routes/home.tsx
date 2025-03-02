import { href, type ClientLoaderFunctionArgs } from 'react-router'
import { requireUser } from '~/services/auth'
import IndexPage from './_index'

export const clientLoader = ({ request }: ClientLoaderFunctionArgs) => {
  const user = requireUser(request, { failureRedirect: href('/') })
  return user
}

export default IndexPage
