
/**
 * Utility functions for formatting and categorizing interaction descriptions
 */

/**
 * Formats description text into bullet points and adds HTML formatting
 */
export const formatDescriptionText = (text: string, medications: string[]): string[] => {
  if (!text) return [];
  
  // Split by common delimiters in medical text
  const sections = text.split(/(?:\. |; |\n)/g).filter(section => section.trim().length > 0);
  
  // Format each section
  return sections.map(section => {
    // Bold medication names if they appear in the text
    const formattedSection = section.replace(
      new RegExp(`(${medications.join('|')})`, 'gi'), 
      '<b>$1</b>'
    );
    
    // Bold key risk terms
    return formattedSection
      .replace(/(risk|warning|caution|avoid|severe|dangerous|fatal|death)/gi, '<b>$1</b>')
      .replace(/(\bdo not\b)/gi, '<b>$1</b>');
  });
};

/**
 * Categorizes bullet points by severity
 */
export const categorizeBulletPoints = (bulletPoints: string[]) => {
  const severeRisks = bulletPoints.filter(point => 
    point.toLowerCase().includes('severe') || 
    point.toLowerCase().includes('fatal') || 
    point.toLowerCase().includes('death') ||
    point.toLowerCase().includes('dangerous') ||
    point.toLowerCase().includes('emergency') ||
    point.toLowerCase().includes('do not')
  );

  const moderateRisks = bulletPoints.filter(point => 
    !severeRisks.includes(point) && (
      point.toLowerCase().includes('caution') || 
      point.toLowerCase().includes('warning') ||
      point.toLowerCase().includes('moderate') ||
      point.toLowerCase().includes('monitor')
    )
  );

  const generalInfo = bulletPoints.filter(point => 
    !severeRisks.includes(point) && !moderateRisks.includes(point)
  );
  
  return {
    severeRisks,
    moderateRisks,
    generalInfo,
    hasSevereRisks: severeRisks.length > 0,
    hasModerateRisks: moderateRisks.length > 0,
    hasGeneralInfo: generalInfo.length > 0
  };
};

/**
 * Creates props for dangerouslySetInnerHTML
 */
export const createHTMLProps = (html: string) => {
  return { __html: html };
};
