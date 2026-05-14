import { getProfile } from '@/lib/actions/profile'
import ProfileView from './view'

export default async function ProfilePage() {
    const result = await getProfile()

    if (!result.success) {
        return (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Không thể tải thông tin. Vui lòng đăng nhập lại.
                </p>
            </div>
        )
    }

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <h1 className="page-title" style={{ margin: 0 }}>Hồ sơ cá nhân</h1>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: 4, fontSize: '0.9rem' }}>
                    Thông tin tài khoản và cài đặt cá nhân
                </p>
            </div>
            <ProfileView profile={result.data} />
        </div>
    )
}
