// Emergency Escalation Engine
// Manages automated state escalation workflow when blood is not immediately secured.

const ESCALATION_STAGES = [
  {
    stage: 'Nearby Donors',
    radiusKm: 5,
    description: 'Scanning 0-5 km perimeter for immediate active donors',
    actionRequired: 'Push notification to active donors in local area'
  },
  {
    stage: 'Expanded Radius Search',
    radiusKm: 25,
    description: 'Expanding scanner to 25 km regional sector',
    actionRequired: 'Alerting all compatible donors and registered mobile units'
  },
  {
    stage: 'Blood Banks',
    radiusKm: 50,
    description: 'Querying centralized blood bank stocks & cold storage',
    actionRequired: 'Direct automated stock reservation requests to accredited blood banks'
  },
  {
    stage: 'Nearby Hospitals',
    radiusKm: 75,
    description: 'Broadcasting inter-hospital peer emergency procurement',
    actionRequired: 'Emergency transfer requisition to partner trauma centers'
  },
  {
    stage: 'District Alert',
    radiusKm: 150,
    description: 'Issuing high-priority District Medical Command alert',
    actionRequired: 'Emergency response protocol activated across district red cross & civil defenses'
  },
  {
    stage: 'State Alert',
    radiusKm: 300,
    description: 'State Health Command Center priority protocol active',
    actionRequired: 'State-wide drone dispatch & air-ambulance logistics standby'
  },
  {
    stage: 'Blood Secured',
    radiusKm: 0,
    description: 'Blood units matched, dispatched, or transfused safely',
    actionRequired: 'Mission accomplished. Case closed.'
  }
];

function getNextEscalationStage(currentStage) {
  const currentIndex = ESCALATION_STAGES.findIndex(s => s.stage === currentStage);
  if (currentIndex === -1 || currentIndex >= ESCALATION_STAGES.length - 1) {
    return ESCALATION_STAGES[ESCALATION_STAGES.length - 1];
  }
  return ESCALATION_STAGES[currentIndex + 1];
}

module.exports = {
  ESCALATION_STAGES,
  getNextEscalationStage
};
