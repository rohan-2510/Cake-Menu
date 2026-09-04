// ============================================
// Official Vector Logos for WhatsApp & Instagram
// ============================================

export function WhatsAppIcon({
  size = 20,
  className = '',
  color = 'currentColor',
  ...props
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={`social-icon social-icon--whatsapp ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path d="M12.004 0C5.373 0 0 5.373 0 12.004c0 2.115.552 4.175 1.6 5.991L.062 24l6.196-1.503a11.96 11.96 0 005.746 1.508c6.631 0 12.004-5.373 12.004-12.005C24.008 5.373 18.635 0 12.004 0zm0 21.977c-1.874 0-3.71-.504-5.308-1.455l-.38-.226-3.682.894.908-3.589-.247-.393a9.96 9.96 0 01-1.528-5.204c0-5.509 4.484-9.993 9.994-9.993 5.51 0 9.994 4.484 9.994 9.993 0 5.51-4.484 9.993-9.994 9.993z" />
      <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.275-.1-.476-.15-.676.15s-.777.979-.953 1.18c-.175.201-.351.226-.652.075-.3-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.201-.301.301-.502.1-.201.05-.376-.025-.526-.075-.151-.677-1.632-.928-2.235-.245-.587-.494-.507-.677-.517l-.577-.01c-.2 0-.527.075-.803.376-.275.301-1.053 1.029-1.053 2.51 0 1.48 1.078 2.909 1.229 3.11.15.201 2.122 3.24 5.141 4.544.718.31 1.279.496 1.716.635.721.23 1.378.197 1.897.12.578-.087 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.076-.126-.276-.201-.577-.352z" />
    </svg>
  );
}

export function InstagramIcon({
  size = 20,
  className = '',
  color = 'currentColor',
  ...props
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`social-icon social-icon--instagram ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
