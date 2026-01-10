import { redirect } from 'next/navigation'

export default function NotFound() {
  // Redirect to the full-page notfound route so it uses the full-page layout
  // Adjust the path if your full-page notfound route differs
  redirect('/notfound')
}
