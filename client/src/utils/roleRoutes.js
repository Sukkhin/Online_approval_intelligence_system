export function getDefaultRoute(role) {
    return role === 'principal' ? '/principal-overview' : '/dashboard';
}
