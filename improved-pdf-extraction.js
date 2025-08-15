// Improved PDF extraction based on actual PDF structure
const extractFireDoorTasks = (pdfText) => {
  const inspection = {
    location: '',
    date: '',
    inspector: '',
    totalDoors: 0,
    compliantDoors: 0,
    nonCompliantDoors: 0
  };

  // Extract basic inspection info
  const clientMatch = pdfText.match(/Client \/ Site\s*\n\s*([^\n]+)/i);
  if (clientMatch) inspection.location = clientMatch[1].trim();

  const dateMatch = pdfText.match(/Conducted on\s*\n\s*(\d{1,2}\s+\w+\s+\d{4})/i);
  if (dateMatch) inspection.date = dateMatch[1];

  const inspectorMatch = pdfText.match(/Fire Door Inspector\s*\n\s*([^\n]+)/i);
  if (inspectorMatch) inspection.inspector = inspectorMatch[1].trim();

  // Extract tasks from door sections
  const tasks = extractDoorTasks(pdfText);
  
  // Update inspection counts
  const uniqueDoors = new Set(tasks.map(t => t.doorId));
  inspection.nonCompliantDoors = uniqueDoors.size;
  inspection.totalDoors = uniqueDoors.size;

  return { inspection, tasks };
};

const extractDoorTasks = (pdfText) => {
  const tasks = [];
  
  // Define remedial actions with their exact text from the PDF
  const remedialActionMappings = [
    {
      pattern: /Adjust and rehang the door\/frame to ensure gaps are 2-4mm\s*on the latch, top, and hinge sides\s*Yes/i,
      title: 'Adjust door gaps to 2-4mm',
      description: 'Adjust and rehang the door/frame to ensure gaps are 2-4mm on the latch, top, and hinge sides',
      category: 'Gap Adjustment',
      priority: 'medium'
    },
    {
      pattern: /Bottom gap - Install a hardwood strip to the bottom of the\s*door \(FD30 only\)\s*Yes/i,
      title: 'Install hardwood strip to bottom',
      description: 'Install a hardwood strip to the bottom of the door (FD30 only)',
      category: 'Gap Adjustment',
      priority: 'medium'
    },
    {
      pattern: /Confirmation\/evidence required to confirm the\s*material\/product used to repair doorset\s*Yes/i,
      title: 'Provide repair documentation',
      description: 'Confirmation/evidence required to confirm the material/product used to repair doorset',
      category: 'Documentation',
      priority: 'low'
    },
    {
      pattern: /Door leaf - Repair damage to door leaf using approved repair\s*techniques?\s*Yes/i,
      title: 'Repair door leaf damage',
      description: 'Repair damage to door leaf using approved repair techniques',
      category: 'Structural Repairs',
      priority: 'medium'
    },
    {
      pattern: /Door lipping to be replaced and ensure it is securely fixed\s*Yes/i,
      title: 'Replace door lipping',
      description: 'Replace door lipping and ensure it is securely fixed',
      category: 'Structural Repairs',
      priority: 'medium'
    },
    {
      pattern: /Door stops to be replaced or repaired\s*Yes/i,
      title: 'Replace/repair door stops',
      description: 'Replace or repair door stops',
      category: 'Structural Repairs',
      priority: 'medium'
    },
    {
      pattern: /Frame - \/architrave to be repaired using approved repair\s*technique\s*Yes/i,
      title: 'Repair frame/architrave',
      description: 'Repair frame/architrave using approved repair technique',
      category: 'Structural Repairs',
      priority: 'medium'
    },
    {
      pattern: /Frame - to be repaired or replace doorset to achieve certified\s*doorset\s*Yes/i,
      title: 'Repair/replace frame for certification',
      description: 'Repair or replace doorset to achieve certified doorset',
      category: 'Structural Repairs',
      priority: 'high'
    },
    {
      pattern: /Handle - Requires tightening\s*Yes/i,
      title: 'Tighten handle',
      description: 'Handle requires tightening',
      category: 'Hardware Issues',
      priority: 'high'
    },
    {
      pattern: /Handle - To be replaced\s*Yes/i,
      title: 'Replace handle',
      description: 'Handle needs to be replaced',
      category: 'Hardware Issues',
      priority: 'high'
    },
    {
      pattern: /Hinges - Replace all hinges with certified hinges\s*Yes/i,
      title: 'Replace all hinges',
      description: 'Replace all hinges with certified hinges',
      category: 'Hardware Issues',
      priority: 'medium'
    },
    {
      pattern: /Hinges - Require intumescent pads installed\s*Yes/i,
      title: 'Install intumescent pads on hinges',
      description: 'Install intumescent pads on hinges',
      category: 'Hardware Issues',
      priority: 'medium'
    },
    {
      pattern: /Latch\/lock to be replaced for certified latch\/lock\s*Yes/i,
      title: 'Replace latch/lock',
      description: 'Replace with certified latch/lock',
      category: 'Hardware Issues',
      priority: 'medium'
    },
    {
      pattern: /Seals - Replace all seals\s*Yes/i,
      title: 'Replace all seals',
      description: 'Replace all door seals',
      category: 'Seal Replacement',
      priority: 'high'
    },
    {
      pattern: /Seals - Install drop down seal\s*Yes/i,
      title: 'Install drop down seal',
      description: 'Install drop down seal',
      category: 'Seal Replacement',
      priority: 'medium'
    },
    {
      pattern: /Seals - Install smoke seals\s*Yes/i,
      title: 'Install smoke seals',
      description: 'Install smoke seals',
      category: 'Seal Replacement',
      priority: 'high'
    },
    {
      pattern: /Seals - Install intumescent seals\s*Yes/i,
      title: 'Install intumescent seals',
      description: 'Install intumescent seals',
      category: 'Seal Replacement',
      priority: 'high'
    },
    {
      pattern: /Seals - Install threshold seal\s*Yes/i,
      title: 'Install threshold seal',
      description: 'Install threshold seal',
      category: 'Seal Replacement',
      priority: 'medium'
    },
    {
      pattern: /Seals - Replace threshold seal\s*Yes/i,
      title: 'Replace threshold seal',
      description: 'Replace threshold seal',
      category: 'Seal Replacement',
      priority: 'medium'
    },
    {
      pattern: /Seal architrave to wall\s*Yes/i,
      title: 'Seal architrave to wall',
      description: 'Seal gap between architrave and wall',
      category: 'Structural Repairs',
      priority: 'medium'
    },
    {
      pattern: /Door closer - Requires adjusting or repairing\s*Yes/i,
      title: 'Adjust/repair door closer',
      description: 'Door closer requires adjusting or repairing',
      category: 'Hardware Issues',
      priority: 'medium'
    },
    {
      pattern: /Doorset to be replaced with ['"]FD30s['"] fire rated doorset.*?\s*Yes/i,
      title: 'Replace entire doorset',
      description: 'Replace with FD30s fire rated doorset (certified installer required)',
      category: 'Complete Replacement',
      priority: 'critical'
    }
  ];

  // Split by door sections - looking for patterns like "Door identification number"
  const doorSections = pdfText.split(/Door identification number/i);
  
  doorSections.forEach((section, index) => {
    if (index === 0) return; // Skip the first part before any door
    
    // Extract door location/ID - looking for pattern like "Bedroom\n1B" or "Bedroom 1B"
    let doorId = '';
    let fullLocation = '';
    
    // Try to find location pattern
    const locationMatch = section.match(/Location of door.*?\n([^\n]+)\n([^\n]+)/i) ||
                         section.match(/Location of door.*?\nBedroom\s*\n([^\n]+)/i) ||
                         section.match(/Location of door.*?\n([^\n]+)/i);
    
    if (locationMatch) {
      if (locationMatch[2]) {
        // Format: "Bedroom" on one line, "1B" on next
        fullLocation = `${locationMatch[1].trim()} ${locationMatch[2].trim()}`;
        doorId = locationMatch[2].trim();
      } else {
        // Format: "Bedroom 1B" on one line
        fullLocation = locationMatch[1].trim();
        // Extract the door number from the location (e.g., "1B" from "Bedroom 1B")
        const idMatch = fullLocation.match(/(\d+[A-Z]?)$/);
        doorId = idMatch ? idMatch[1] : fullLocation;
      }
    }
    
    // If no doorId found, try the door identification number
    if (!doorId) {
      const numberMatch = section.match(/^[\s]*(\d+)/);
      if (numberMatch) {
        doorId = numberMatch[1];
      }
    }
    
    // Default values if nothing found
    if (!doorId) doorId = `Door-${index}`;
    if (!fullLocation) fullLocation = doorId;
    
    // Find the Remedial Action section for this door
    const remedialMatch = section.match(/Remedial Action([\s\S]*?)(?:Compliance Rating|$)/i);
    
    if (remedialMatch) {
      const remedialSection = remedialMatch[1];
      
      // Check each remedial action pattern
      remedialActionMappings.forEach(action => {
        if (remedialSection.match(action.pattern)) {
          tasks.push({
            doorId: doorId,
            location: fullLocation,
            title: `${doorId} - ${action.title}`,
            description: action.description,
            category: action.category,
            priority: action.priority,
            status: 'pending'
          });
        }
      });
    }
  });

  // Sort tasks by priority and then by door ID
  const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
  tasks.sort((a, b) => {
    const prioDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (prioDiff !== 0) return prioDiff;
    
    // Sort door IDs naturally (1A, 1B, 2A, 2B, etc.)
    return naturalSort(a.doorId, b.doorId);
  });

  return tasks;
};

// Natural sort function for door IDs like "1A", "1B", "10A", etc.
const naturalSort = (a, b) => {
  const regex = /(\d+)([A-Z]?)/;
  const aMatch = a.match(regex);
  const bMatch = b.match(regex);
  
  if (aMatch && bMatch) {
    const aNum = parseInt(aMatch[1]);
    const bNum = parseInt(bMatch[1]);
    
    if (aNum !== bNum) return aNum - bNum;
    
    // If numbers are same, compare letters
    const aLetter = aMatch[2] || '';
    const bLetter = bMatch[2] || '';
    return aLetter.localeCompare(bLetter);
  }
  
  return a.localeCompare(b);
};

// Debug function to help troubleshoot extraction
const debugPDFExtraction = (pdfText) => {
  console.log('=== PDF EXTRACTION DEBUG ===');
  
  // Find a sample door section
  const doorStart = pdfText.indexOf('Door identification number');
  if (doorStart > -1) {
    const sampleSection = pdfText.substring(doorStart, doorStart + 2000);
    console.log('Sample door section:');
    console.log(sampleSection);
    
    // Test location extraction
    const locationMatch = sampleSection.match(/Location of door.*?\n([^\n]+)\n([^\n]+)/i);
    console.log('Location match:', locationMatch);
    
    // Test remedial section
    const remedialStart = sampleSection.indexOf('Remedial Action');
    if (remedialStart > -1) {
      console.log('Remedial section found at position:', remedialStart);
      const remedialSample = sampleSection.substring(remedialStart, remedialStart + 500);
      console.log('Remedial sample:', remedialSample);
    }
  }
  
  return true;
};

module.exports = {
  extractFireDoorTasks,
  debugPDFExtraction
};