/* Chat AET Planner Engine v1
 * Planner -> Executor -> Verifier -> Replanner orchestration primitives.
 * This client module is intentionally execution-safe: it creates structured plans,
 * tracks progress, and never performs privileged DB/API mutations by itself.
 */
(function(global){
  const VERSION='1.0.0';
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function normalizeStep(step,index){
    return {
      id:String(step?.id||`step-${index+1}`),
      title:String(step?.title||`Step ${index+1}`),
      goal:String(step?.goal||''),
      dependsOn:Array.isArray(step?.dependsOn)?step.dependsOn.map(String):[],
      successCriteria:Array.isArray(step?.successCriteria)?step.successCriteria.map(String):[],
      status:String(step?.status||'pending'),
      attempts:Number(step?.attempts||0),
      result:step?.result??null,
      verification:step?.verification??null,
      risk:String(step?.risk||'low'),
      requiresApproval:Boolean(step?.requiresApproval)
    };
  }
  function createPlan(input){
    const steps=(Array.isArray(input?.steps)?input.steps:[]).map(normalizeStep);
    return {
      version:VERSION,
      id:String(input?.id||`plan-${Date.now()}-${Math.random().toString(36).slice(2,8)}`),
      goal:String(input?.goal||''),
      constraints:Array.isArray(input?.constraints)?input.constraints.map(String):[],
      assumptions:Array.isArray(input?.assumptions)?input.assumptions.map(String):[],
      successCriteria:Array.isArray(input?.successCriteria)?input.successCriteria.map(String):[],
      riskLevel:String(input?.riskLevel||'low'),
      status:'planned',
      currentStepId:steps[0]?.id||null,
      steps,
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
  }
  function nextRunnableStep(plan){
    if(!plan||!Array.isArray(plan.steps))return null;
    return plan.steps.find(s=>s.status==='pending'&&s.dependsOn.every(id=>plan.steps.some(x=>x.id===id&&x.status==='passed')))||null;
  }
  function startStep(plan,id){
    const s=plan.steps.find(x=>x.id===id); if(!s)return null;
    s.status='running'; s.attempts++; plan.currentStepId=s.id; plan.status='running'; plan.updatedAt=new Date().toISOString(); return s;
  }
  function verifyStep(plan,id,verification){
    const s=plan.steps.find(x=>x.id===id); if(!s)return null;
    const pass=Boolean(verification?.passed);
    s.verification=verification||{}; s.status=pass?'passed':'failed';
    if(pass){const n=nextRunnableStep(plan);plan.currentStepId=n?.id||null;if(!n)plan.status='completed';}
    else plan.status='needs_replan';
    plan.updatedAt=new Date().toISOString(); return s;
  }
  function replan(plan,changes){
    if(!plan)return null;
    const additions=Array.isArray(changes?.steps)?changes.steps:[];
    for(let i=0;i<additions.length;i++)plan.steps.push(normalizeStep(additions[i],plan.steps.length+i));
    if(Array.isArray(changes?.constraints))plan.constraints.push(...changes.constraints.map(String));
    if(Array.isArray(changes?.assumptions))plan.assumptions.push(...changes.assumptions.map(String));
    plan.status='replanned'; plan.currentStepId=nextRunnableStep(plan)?.id||null; plan.updatedAt=new Date().toISOString(); return plan;
  }
  function progress(plan){
    const total=plan?.steps?.length||0, passed=plan?.steps?.filter(s=>s.status==='passed').length||0;
    return {total,passed,percent:total?Math.round(passed/total*100):0,status:plan?.status||'none',currentStepId:plan?.currentStepId||null};
  }
  global.ChatAETPlanner={VERSION,createPlan,nextRunnableStep,startStep,verifyStep,replan,progress,clamp};
})(window);
