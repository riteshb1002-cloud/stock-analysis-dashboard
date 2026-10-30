import html2canvas from 'html2canvas';

export async function captureDashboardScreenshot(
  elementId: string,
  ticker: string
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: null
    });

    const dataUrl = canvas.toDataURL('image/png');
    const dateStr = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.download = `${ticker}_stock_dashboard_${dateStr}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Failed to capture dashboard screenshot:', err);
    return false;
  }
}
