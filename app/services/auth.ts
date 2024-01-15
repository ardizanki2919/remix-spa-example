import { redirect } from '@remix-run/react'
import {
  GoogleAuthProvider,
  type User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
} from 'firebase/auth'
import { createContext, useContext, useEffect, useState } from 'react'
import { getAccountByUID } from '~/models/account'
import { app } from './firebase'

export const AuthContext = createContext<User | null | undefined>(null)
/**
 * root コンポーネントでの認証モニタリング
 */
export const useAuthStateObserve = () => {
  // Context 設定用の user state
  const [authState, setAuthState] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    const auth = getAuth(app)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState(user)
    })
    return () => unsubscribe()
  }, [])

  return {
    authState,
  }
}

/**
 * コンポーネントでの認証利用用
 */
export const useAuthUser = () => {
  return useContext(AuthContext)
}

/**
 * clientLoader / clientAction での認証確認
 * @returns
 */
interface AuthentiateProps {
  successRedirect?: string
  registerRedirect?: string
  failureRedirect?: string
}
export const authenticate = async (props?: AuthentiateProps) => {
  // 認証初期化を待つ
  const auth = getAuth(app)
  await auth.authStateReady()

  // ログインしていない場合は失敗時のリダイレクト先にリダイレクト
  if (!auth.currentUser) {
    if (props?.failureRedirect) throw redirect(props?.failureRedirect)
    return null
  }

  // アカウント未登録の場合は初期設定画面にリダイレクト
  const account = await getAccountByUID(auth.currentUser.uid)
  if (!account && props?.registerRedirect)
    throw redirect(props?.registerRedirect)

  // 登録済みの場合は成功時のリダイレクト先にリダイレクト
  if (props?.successRedirect) throw redirect(props?.successRedirect)

  // リダイレクト設定がない場合はユーザ情報をそのまま返す
  return auth.currentUser
}

/**
 * サインイン
 * @returns
 */
export const signIn = async () => {
  const auth = getAuth(app)
  const provider = new GoogleAuthProvider()
  provider.addScope('profile')
  provider.addScope('email')
  return await signInWithPopup(auth, provider)
}

/**
 * サインアウト
 */
export const signOut = async () => {
  const auth = getAuth(app)
  await auth.signOut()
}
