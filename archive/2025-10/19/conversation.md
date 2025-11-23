Sam Gossage
Social Garden
Friday, May 09
SG
Sam Gossage
7:44 AM
Hi Ahmad
Sam here working at Social Garden with George.
I'm looking to work on an AI agent that can help us with scoping documentation. It would be great to get your support on the agent and prompt setup.
Can you please book a call with me for next week to discuss the project - https://calendar.app.google/yyUM7nWDShnBAw5L8



Thanks,
Sam

Appointment w/Sam - Sam Gossage
Ahmad Basheer
10:03 AM
Hi Sam,



Thanks so much for reaching out and for the calendar link – this is great! I've just booked a slot for Monday at 9:30 AM.



The project you described – an AI agent to help with scoping documentation and the like – immediately caught my attention. Streamlining the creation of complex documents, whether they're internal SOWs or responses to detailed RFPs, is a challenge I've been focused on solving for many years, even before the current AI boom.



Since AI tools have become more powerful and accessible, I've actively explored and implemented solutions for similar documentation and proposal generation challenges. It's an area where I see immense potential. The idea of building an intelligent agent to tackle this for Social Garden, especially with how AI is advancing now, is something I'm genuinely enthusiastic to explore further with you.



Looking forward to our discussion on Monday and hearing more about your vision!



Best regards,



Ahmad Basheer

SG
Sam Gossage
10:48 AM
Thanks mate, look forward to running through it Monday

Tuesday, May 13
Ahmad Basheer
1:57 AM
Hi Sam



Great chatting with you



To get the prototype underway as discussed, I'll need two key things from your side when you get a moment:



The sample brief/call transcript you mentioned you'd send over.
Your current Rate Card and list of Roles (a simple sheet/CSV would be perfect).
Once I have those, I can start architecting the initial AI model and prompt structure.



To ensure the first prototype hits the mark for you, could you clarify: For this initial proof-of-concept, which output format is the absolute priority for you to see first – a Google Sheet or a Google Document? Knowing this will help me focus the initial build effectively.



Looking forward to receiving the materials. As soon as I have them, I'll aim to get a prototype back to you within the week we discussed.



Best regards,



Ahmad Basheer

Saturday, May 17
Ahmad Basheer
1:34 PM
Hi Sam,



I hope this email finds you well.



Following up on your request, I've attached the prompt we discussed. I've also tested it by creating a dummy knowledge base to ensure it functions as intended.



If a well-defined prompt is all you're looking for at the moment, please consider this a goodwill gesture.



However, I'm confident that I can design a more robust and comprehensive solution that would truly elevate your proposal generation process. I'd be happy to discuss this further and explore how we can create something even more impactful for Social Garden.



Best regards,



------The Prompt-----
You are "ProposalPrime," the Proposal Director for Social Garden, a high-performance marketing agency renowned for delivering full-funnel media solutions, video content that converts, and effectively unleashing first-party data. Your function is to autonomously analyze client requirements (from briefs, transcripts, and relevant client website information) and internal agency data to generate a precise, structured, and machine-readable dataset representing a costed scope of work. This dataset is the foundational input for a separate process that will generate the final client-facing proposal document.



Your Core Instructions:



Understand Input: You will receive a client project brief. This brief might be from meeting notes or a transcript and may include a target budget and a client website URL.
Initial Client Research (If URL Provided): If a client website URL is provided in the input, perform a quick analysis of the website to understand the client's industry, main offerings, and general company profile. Use this information to help tailor the relevance of suggested services and the details within the scope.
Access and STRICTLY ADHERE to Knowledge Base (KB): Your primary source of truth for agency standards, pricing, and service structure is "Sam's AI Proposal Agent - Enhanced Knowledge Base (KB)" (document ID: sams_ai_kb_v1). You MUST get the details from this KB. This KB contains:
Part A: Rate Card: A list of Social Garden's job roles and their standard USD hourly rates. Always use these roles and rates for costing.
Part B: Granular Service Module Library: A library of common, combinable service modules offered by Social Garden, with typical phases, tasks, default role assignments (including any ROLE_FLEXIBILITY options), and baseline hour estimates. These are your building blocks for constructing bespoke proposals.
Part C: Budget Adjustment & Blending Rate Guidelines: Rules and strategies for attempting to meet a client's target budget, including how to apply "blended rates" or suggest scope adjustments using the granular modules and role flexibility options.
Generate Structured Dataset - Your Main Task: Based on the client brief, any initial client research, and by meticulously applying the information from "Sam's AI Proposal Agent - Enhanced Knowledge Base (KB)" (sams_ai_kb_v1), your output must be a structured dataset (preferably in JSON format) containing the following information for the project:
Identified Services: Clearly list the main services the client needs, informed by the brief and your understanding of the client's business. Assemble these services by selecting and combining appropriate Granular Service Modules from the KB.
For Each Assembled Service:
Phases & Deliverables: Detail the logical phases and key deliverables/tasks, derived from the chosen Granular Service Modules and adapted to the client brief.
Role Assignment: For each task/deliverable, assign the most appropriate role(s) as specified in the selected Granular Service Modules, using the RateCard.csv data from the KB. Consider ROLE_FLEXIBILITY options from the modules if budget optimization becomes necessary.
Hour Estimation: Estimate the number of hours required for each assigned role. Start with the Baseline Hours from the Granular Service Modules and adjust based on the client brief, research, and perceived complexity.
Cost Calculation: For each role on each task, calculate the cost (Estimated Hours * Role's Hourly Rate from the RateCard.csv in the KB).
Sub-Totals: Provide a sub-total cost for each main assembled service.
Budget Adherence Logic (If Target Budget Provided):
Calculate the total estimated project cost.
If a target budget was provided, compare your calculated total to it.
If your initial estimate is over budget, apply strategies from the BudgetAdjustmentGuidelines.kb. Clearly document any adjustments made (including which modules were adjusted, or if alternative roles were used from ROLE_FLEXIBILITY options) and the reasoning within the dataset (e.g., in a 'budgetAdjustmentNotes' field).
Key Assumptions: List any critical assumptions made (informed by the brief, research, and the COMMON_ASSUMPTIONS within the selected Granular Service Modules from the KB).
Grand Total Project Cost: The final estimated cost.
Output Format Specification:
Your primary output should be a single, well-formed JSON object representing the entire proposal dataset. This JSON should be structured logically with clear nesting for services, phases, deliverables, roles, hours, and costs. Ensure all numerical values (hours, rates, costs) are represented as numbers.



Example JSON Structure Snippet (Illustrative):



JSON



{
"projectTitle": "Example Project for Client X",
"identifiedServices": [
{
"serviceName": "Assembled Service One (e.g., Landing Page Package)",
"contributingModules": ["LP_Discovery_InitialConsult", "LP_Planning_SitemapUserFlow_Basic", "..."],
"phases": [
{
"phaseName": "Phase Alpha (from module)",
"deliverables": [
{
"description": "Deliverable A1 (from module, potentially tailored)",
"assignedRoles": [
{"role": "Designer", "hours": 10, "rate": 120, "cost": 1200},
{"role": "Project Manager", "hours": 2, "rate": 150, "cost": 300}
]
}
]
}
],
"serviceAssumptions": ["Assumption 1 for Service One (from modules/brief)"],
"serviceSubTotal": 1500
}
],
"budgetAdjustmentNotes": "Applied Role_Flexibility for LP_Discovery_InitialConsult, saving $X. Reduced baseline hours for LP_QATesting_Basic by Y hours.",
"overallAssumptions": ["Global assumption 1"],
"grandTotalProjectCost": 1500
}
---------------------------



The dummy data I was testing with please find it attached

2 files 
Sam's AI Proposal Agent - Dummy Knowledge Base (KB).pdf
101 kB
Sam's AI Proposal Agent - Enhanced Knowledge Base (KB).pdf
95 kB
Tuesday, May 20
SG
Sam Gossage
4:10 AM
Hey Ahmad,

Ahmad Basheer
4:26 AM
Hi Sam how are ou

SG
Sam Gossage
6:11 AM
Thanks for this, this is great appreciate you putting this together. I will get some time later this week to write up more of a brief and come back to you.

Monday, May 26
SG
Sam Gossage
8:23 AM
Can you use this rate card as an example of the roles the AI model can pick from to put into i.e. a google sheet table

[TEMPLATE] Customer Journey Mapping Social Garden Scope Template 2025 - Social Garden Rate Card.csv 
[TEMPLATE] Customer Journey Mapping Social Garden Scope Template 2025 - Social Garden Rate Card.csv
6 kB
This is an. example of a template scope of work for a customer journey map, we have a number of different types of scopes for different types of work though. https://docs.google.com/spreadsheets/d/1Wlyozt-YiL-3gO7xhYjKvlKJHGMDmsxtkLn8XQ3qyrs/edit?gid=1273114859#gid=1273114859

You can see from the example it contains information such as this on the first page:



Overview:
This scope of work details a proposed solution for Social Garden to support [CLIENT] with [Marketing Automation, CRM, Integration] [ADVISORY, CONSULTATION, MANAGED SERVICES] related to the [PROJECT] .



What does the scope include?
• [i.e. Nurture Program / Email Template Refresh / Audit]



Project Outcomes :
• One easy to use unified system: A unified marketing automation platform and CRM empowering you to seamlessly align your sales and marketing efforts
• Improved user experience: Prospects having a better user experience and journey aligned to your particular services.
• Solution powered by workflow and automation: Journey powered by automated workflows to help remove manual follow-up
• Reduced processing times: Optimised and streamlined time to appointment to optimise delivering a connected prospect experience
• Improved conversion rates: Nurturing prospect to their next call to action to improve on conversion rates and engagement.
• Improved insights: Improved data and reporting to better manage tactical campaigns and prospect insights.



Project Phases :
• Discovery & Planning
• Technical Assessment & Setup
• Quality Assurance & Testing
• Final Delivery & Go-live



Scope Assumptions:
• Please note if dependencies and assumptions cannot be met, the estimate may be adjusted or re-scoped
• Please note rates are not locked in and if agreement is not signed within 30-days may be subject to change
• Hours outlined are capped and provided as an estimate, if exceeded your Account Manager will work with you to scope more hours accordingly
• Project timeline and dates will be finalised and mapped out post sign off and kick-off meeting
• Timelines are an estimate and can change depending on the complexity of the project

Then the scope will have the list of items/deliverables i.e:



DELIVERABLES 1 :
+ Objective setting
+ Review existing system and process
+ Identify and understand
+ Setup and build
+ User testing
+ Approval workflow



PHASES :
+ Discovery & Planning
+ Technical Set Up / Assessment
+ Quality Assurance & Testing
+ Final Delivery



Account & Project Management Services:
+ Kick-Off, Project Status Updates, Internal Project Briefing & Project Management

And then a table with the role/task and hours associated then have the hourly rate and total at the end i.e.



Tech - Sr. Consultant - Campaign Strategy 10 $295 $2,950
Tech - Head Of - Program Strategy 6 $365 $2,190
Tech - Producer - Services 6 $120 $720
Tech - Sr. Architect - Integration Strategy 5 $365 $1,825
Tech - Specialist - Campaign Orchestration 14 $180 $2,520
Tech - Delivery - Project Coordination 3 $110 $330
Account Management - (Senior Account Manager) 6 $210 $1,260
50 $235 $11,795

With deliverable assumptions underneath i.e:



Deliverable Assumptions:
- Social Garden to be briefed by client
- MAP automation, email & SMS build handled by Social Garden.
- Landing Page development, design and integration handled by client.
- Client will be providing imagery required and brief on copy and content
- Social Garden to be provided with access to the MA/CRM systems with an understanding of the data model structure
- Client to support/action requests if we encounter limited or no access to systems
- Account & Project Management services priced for project duration
- Client to come back with feedback and approval in 3-7 days of requests
- Project due dates dependent on SOW sign off
- Timeline is dependant on the brief and required work, the timeline is an estimate and can change depending on the complexity of the project
- Hours outlined are capped and provided as an estimate, if we exceed hours Social Garden will work with you to rescope and charge accordingly
- Cost does not include subscription or pricing for any martech platform
- If email testing & rendering is included we test an estimated 30 up to date email clients across a combination of mobile, desktop and web devices i.e. iOS, macOS, Windows, Android, Apple Mail, Outlook, Gmail & Yahoo.
- Max 2x rounds of client feedback and then 1x final round of approval between the AM and client.
- Hours outlined are capped and provided as an estimate, if exceeded your Account Manager will work with you to scope more hours accordingly
- Once assets and programs are delivered if extra support and troubleshooting requests are required we can scope out a support retainer accordingly

Basically if you can come up with a tool that can be programmed to say i.e. Can you please create scope of work for me for this client, for this piece of work i.e. email template production for X amount of templates and then it can blend the rates across roles/tasks for i.e. email production, design, development, deployment, testing, handover, account management, head of project management (less hours) and account management and come to a summarised price based on hours expected that would be great

Output should be a branded Social Garden document either gdoc, gslide or gdoc style

SG
Sam Gossage
9:50 AM
The scope doesn't need to breakdown the hours across each deliverable, it just needs to list all the deliverables then have hours summarised based on the role/task type.

Can you try and put together a working prototype via whichever AI platform you feel will work best to output a presentable format. Send me a message back to confirm once you've read all of the above if you like. Cheers, Sam!

Tuesday, May 27
SG
Sam Gossage
10:21 AM
Hey does the above make sense?

Can you confirm if you're working on it? Cheers mate

Ahmad Basheer
12:50 PM
Hi Sam,



Thanks for checking in! Yes, absolutely, everything we've discussed regarding the SOW automation makes perfect sense, and I can confirm I'm actively working on it.



I'm making some solid progress on the core engine. My main focus for this first step is to ensure we can achieve complete data integrity and accuracy when generating the foundational Scope of Work information. This means making sure all the data points (like services, deliverables, roles, hours, and costs from the official rate card) are correctly processed and structured based on your requirements and the "Sam KB" we're building. This is the crucial foundation.



The second step, as you mentioned, will then be templating this structured data into the nice Google Doc or Sheet formats to produce that polished, "proposal worthy" output.



I'm aiming to have a concrete update or a preliminary demonstration of this core data generation for you in the next day or two – something I'm hoping you'll find very promising.



In the meantime, if you have any additional notes that have come to mind, specific SOW examples you've been thinking about, or any other immediate thoughts or refinements, please definitely send them my way. Your feedback is invaluable as we build this out, and I'd love to hear if there's anything else you'd like to add or modify in our current approach.



Looking forward to sharing the progress with you very soon!



Cheers,



Ahmad

tosam.mp4 
tosam.mp4
194 MB
Wednesday, May 28
SG
Sam Gossage
2:45 AM
Hey just a note on this, I don't want it to be trained off of existing deliverables and items, as a lot of the scopes are bespoke. I want the AI to come up with the deliverables based on the prompt and brief, but be open to prompt suggestions. Similar to if you are putting a basic prompt into GPT to create the deliverables, it can follow a similar structure based on delivery (which often GPT will follow anyway) i.e. Discovery & Planning, Technical Assessment or Setup, Quality Assurance & Testing and Final Delivery, Training & Handover, but the intricate details should vary depending on if it is i.e. a MAP/CRM Implementation, Audit, Customer Journey Mapping, Email Template Production, Nurture Build for X amount of emails, Landing Page Setup, Quoting System Setup in HubSpot, Lead Scoring Setup, Basic Integration Services from the Website to Marketing Automation Platform or CRM, Live Chat or Chatbot Setup, Technical Support Retainer, Managed Services Support Subscription etc. etc. and all based on different types of platforms i.e. Salesforce Sales Cloud, Marketing Cloud. Adobe Marketo, Oracle Eloqua, HubSpot Marketing, Sales or Service Hub, Dynamics 365, Pipedrive, etc. etc.

Ahmad Basheer
2:37 PM
Hi Sam well received let me take a close look and plan things and will come up with a solution, thanks

Ahmad Basheer
11:05 PM
Hi Sam,



Following our recent work and intensive testing with the AI SOW generator, I've put together a checklist to highlight how the system now addresses the key requirements and capabilities we've been aiming for. We've run several tests based on different project types, including advisory engagements like Customer Journey Mapping and more technical builds involving Marketing Automation enhancements with budget considerations, and the results showcase significant advancements:



AI SOW Generator: Checklist of Achieved Capabilities



[✅] 1. Automated & Comprehensive SOW Generation:



The AI consistently generates detailed Scopes of Work based on varied client briefs and project types.
This meets your core need for an AI assistant to help with scoping documentation.
[✅] 2. Adherence to Social Garden's SOW Structure:



The AI outputs follow the standard SOW structure discussed, including sections like Overview, What Scope Includes, Project Outcomes, Project Phases & Deliverables, Account & Project Management, Pricing Summary, Assumptions, and Timeline Estimate.
This aligns with the SOW template and examples you provided on May 26th.
[✅] 3. Correct Use of Your Specific Rate Card & Roles:



The AI accurately uses the roles and hourly rates from the Social Garden Rate Card (KB Part A) in all pricing summaries.
This fulfills your requirement from May 26th to use the specified rate card for all costing.
[✅] 4. Generation of Bespoke, AI-Devised Deliverables:



The AI generates specific, relevant deliverables tailored to the project requirements within each phase, rather than using pre-defined, static lists.
This addresses your critical feedback from May 28th that the AI should "come up with the deliverables based on the prompt and brief."
[✅] 5. Context-Appropriate Project Phases & Naming Conventions:



The AI utilizes standard project phases and has demonstrated the ability to use nuanced, client-friendly phase names appropriate to the project type (e.g., advisory-focused names for strategic projects vs. standard technical names for build projects), as guided by the enhanced Knowledge Base.
This ensures clarity and aligns with best practices, refining the general phase structure you outlined on May 28th.
[✅] 6. Versatility Across Diverse Service Types & Platforms:



The system has successfully generated SOWs for different services and can be adapted for various platforms by detailing requirements in the prompt and Knowledge Base.
This demonstrates the capability to handle the variety of project types you listed on May 28th.
[✅] 7. Accurate & Complete Pricing with Realistic Team Composition:



The AI includes a comprehensive and realistic team in the pricing summary, pulling all necessary roles (including Account Management and Project Coordination, where appropriate for the project type) from the rate card. This is guided by the "Typical Team Composition" information now structured in the Knowledge Base.
This addresses the iterative feedback we've had to ensure full and accurate costing for all stated services.
[✅] 8. Effective Handling of Budget Constraints:



The AI can process a target budget, adjust estimated hours to meet that budget if feasible, and include "Budget Notes" to explain any optimizations made (as successfully demonstrated in recent tests).
This meets your request from May 26th regarding the AI's ability to work with budgets and summarize pricing based on expected hours.
[✅] 9. Professional Output Format:



The AI generates well-structured Markdown content, which serves as an excellent, easily transferable source for creating professionally branded Social Garden documents (GDocs, GSlides, etc.).
This provides the flexible, professional output you were looking for on May 26th.
[✅] 10. Comprehensive & Relevant Assumptions:



The SOWs include both standard project assumptions (from the Knowledge Base, aligned with examples like those in the initial CSV overview ) and relevant, AI-generated project-specific assumptions.
This ensures clarity on scope boundaries, as per standard SOW requirements.
I believe the system, with the current "Master Instructions v4.0" prompt and the enhanced Knowledge Base, is now in a strong position to consistently deliver SOWs that meet your requirements.



Here’s a short video of how it acts and what content it now generates:
https://www.loom.com/share/b642ea58f1764dca8a325de258cd8450?sid=eb669d7d-7ef0-4fe1-befd-618ac22facb3



If this is okay with you, please let me know so I can move on to the next step where we make this text-based output an actual document template you can use to send to your clients.



Best regards,

Open WebUI - 28 May 2025
Use Loom to record quick videos of your screen and cam. Explain anything clearly and easily – and skip the meeting. An essential tool for hybrid workplaces.
Loom
Thursday, May 29
SG
Sam Gossage
2:09 AM
Yeah great move onto the next phase

Let me know when you have a finalised working prototype

There's a few brief examples I'd like to put through it

For the tool, if we can have a 2-step process. I.e. put the brief through, then I review the output before it goes into the document to provide iterations and updates, then prompt to create the document, and the document is using i.e. Social Garden branding etc. that would be perfect

Ahmad Basheer
2:23 AM
Hi Sam this is great to hear before we can move on to the next phase i need to be a 110% sure that the current output it okay with you, so give me a few hours time and i will give you a temp access for you to test with your own brief examples if all is well great and can go head if anything needs modifying then pleases let me know and we'll get to it.. I'll share with you the link in a bit thanks!

Ahmad Basheer
3:59 AM
Hi Sam



https://social-socialgarden.vdvedk.easypanel.host/
username: sam

password:112233445566

SG
Sam Gossage
4:08 AM
Hey i've tested it, it's not really picking and identifying the roles in the right way and estimating hours effectively

It seems to just pick the minimum amount of tasks/roles to try to get to the hours and estimate cost but selects more hours for senior work than necessary

Ahmad Basheer
4:11 AM
do you see this ? with the output?

image.png 
image.png
Ahmad Basheer
4:18 AM
could you try again now please

SG
Sam Gossage
12:16 PM
Tried again, yeah it's not corresponding in the same way. Can you see this large sheet of example scopes of work. We have i.e. for nurture email production, copywriting, design, development, deployment, testing, integration, campaign orchestration, reporting and then head of senior project management, project coordination and account management. You'll see this is similar across different types of scopes but with different hours related to different types of work. Each scope should include smaller/minimal hours for Head of Senior Project management and then project coordination with a set of account management hours as well. If we can define this to the model so it looks for the right type of roles then always applies a small amount of senior project managment and project coordination and then a larger amount of account management on each job alongside the production hours that would be great - https://docs.google.com/spreadsheets/d/1TZPvm4PO3XgQFapczf29BX-44PyOdnklQiQz42C7Ies/edit?gid=1121200334#gid=1121200334

At the moment as an example it puts too many hours on senior time and campaign orchestration we need to split out across Email production, dev, design, copy, deployment, testing etc.

See example from a recent one here: ---- |
| Tech - Sr. Consultant - Campaign Strategy | 10 | $295 | $2,950 |
| Tech - Specialist - Campaign Orchestration | 28 | $180 | $5,040 |
| Tech - Delivery - Project Coordination | 6 | $110 | $660 |
| Account Management - (Senior Account Manager) | 6 | $210 | $1,260 |
| Totals | 50 | | $9,910 |

Other than that it looks pretty good in terms of output at the moment

It just focuses a little too much on the customer journey mapping piece at the moment because of the original example scope I gave you I think. Take a look at that new link with a bunch more examples

SG
Sam Gossage
12:43 PM
I'd also like the ability to add discount and show the original price and discounted price to the scopes as well if you can apply that logic to the model

Ahmad Basheer
4:08 PM
Hi Sam i think we finally nailed it could you confirm

SG
Sam Gossage
4:17 PM
Can you confirm you've seen the above messages and taken into consideration the new scope examples

Ahmad Basheer
4:19 PM
Yes i ran a lot of tests and used this checklist for a reference and eventually i got a consistent pass every time



Sam's Expected SOW Output Checklist



I. Overall Structure & Brief Adherence:



[ ] 1.1. Complete Brief Coverage: Does the SOW generate full details for EACH distinct option or SOW presented in the input client brief? Are all options clearly delineated if multiple exist?
[ ] 1.2. Granular Component Detailing: If an option in the client brief is broken down into sub-components with their own specific cost estimates (e.g., a "Full-Service" option having individually costed items like 'HubSpot Setup - $Xk', 'Integration - $Yk'), does the SOW provide a specific scope description, deliverables, and a dedicated Pricing Summary / Investment table for EACH such itemized sub-component, targeting its unique cost estimate?
[ ] 1.3. Standard SOW Structure Adherence: Does each generated SOW (or SOW option/sub-component) follow the agreed-upon Social Garden structure (e.g., Overview, What Scope Includes / Objectives, Project Outcomes, Project Phases & Deliverables, Account & Project Management, Pricing Summary, Assumptions, Timeline Estimate)? Is the content well-organized for a professional document?
II. Content Quality & Detail:



[ ] 2.1. Bespoke, AI-Devised Deliverables: Are deliverables specific to the project requirements from the current client brief, detailed appropriately, and genuinely generated by the AI (not generic lists)?
[ ] 2.2. Context-Appropriate Project Phases & Naming: Does the SOW use standard project phases, AND are the phase names nuanced and client-friendly, reflecting the project type (e.g., advisory-focused names for strategic projects vs. standard technical names for build projects, as guided by the generating AI's Knowledge Base)?
[ ] 2.3. Comprehensive & Relevant Assumptions: Does the SOW include relevant standard general assumptions AND insightful project-specific assumptions tailored to its scope?
III. Pricing, Roles & Hour Allocation (Key Focus):



[ ] 3.1. Correct & Expanded Rate Card Usage: Do all roles and their hourly rates in pricing summaries precisely match the expanded Social Garden Rate Card (assumed to include granular production and specialist roles based on PDF examples )?
[ ] 3.2. Granular & Specific Role Assignment: Does the AI assign tasks and hours to the most specific, granular role available in the rate card that is appropriate for that task (e.g., "email copywriting" uses a specific "Copywriter" role , not a general "Specialist")? Does it avoid overusing generalist roles?
[ ] 3.3. Realistic & Balanced Hour Distribution: Does the allocation of hours across roles reflect a practical and efficient way to deliver the work? Crucially, does it avoid allocating excessive hours to senior roles for execution-heavy tasks, with the bulk of execution work assigned to appropriate specialist or producer-level roles?
[ ] 3.4. Mandatory Management & Coordination Layers Priced: Does each SOW/Option/Priced Component consistently include and price for:
Appropriate (often minimal) hours for "Tech-Head Of Senior Project Management" (or equivalent "Head Of" role )?
Appropriate hours for "Tech-Delivery - Project Coordination" (or "Tech-Delivery Project Management" )?
A set of "Account Management (Account Manager or Senior Account Manager)" hours ?
[ ] 3.5. Complete Team for Realistic Delivery: Is the overall team composition in each pricing summary realistic, including all necessary functions (strategic, technical execution via granular roles, coordination, account management) to successfully deliver the scope, referencing any "Typical Team Composition" guidelines from the generating AI's Knowledge Base where applicable (derived from PDF examples )?
[ ] 3.6. Transparent Budget & Cost Estimate Alignment: If the client brief provided specific cost estimates, does the SOW's pricing aim to meet these targets? Do "Budget Notes" clearly and transparently explain how the pricing aligns and how hours were allocated realistically? If an overall SOW cost exceeds a client-provided budget, are transparent adjustments proposed?
IV. New Functionality & Output Quality:



[ ] 4.1. Discount Presentation (If Applicable): If the input brief for the SOW specified a discount, does the pricing summary clearly show: Sub-Total (Before Discount), Discount Description/Percentage, Discount Amount, and Grand Total (After Discount)?
[ ] 4.2. Adaptability & Focus on Current Brief: Is the AI's output clearly driven by the specifics of the current client brief it processed, without undue influence from unrelated past examples?
[ ] 4.3. Professionalism & Formatting: Is the output well-structured, clear, professional in tone, and effectively formatted in Markdown?
[ ] 4.4. Concluding Statement: Does the SOW end with the exact phrase: *** This concludes the Scope of Work document. ***?

if you run a test and u don't get a complete output just say proceed, is because its handling a lot and cant generate very long output if so if you see at the end This concludes the Scope of Work document. **
than that's it, if not just say proceed it shoudl continue

SG
Sam Gossage
4:38 PM
Legend, ok so I can test the same model / login again?

Ahmad Basheer
4:47 PM
yes please do im super excited to see this working the way you wnat finger crossed

SG
Sam Gossage
4:51 PM
Looks so good

Legend

Latest example is spot one

Ahmad Basheer
4:53 PM
YES!!! haha awessome to hear

SG
Sam Gossage
4:55 PM
Yes unreal

Let's go on creating a document from the scopes

Ahmad Basheer
4:55 PM
okay so i think now its safe to move to the next step that is the actual document\sheet etc could you please tell me what do you prefer between what you have mentioned from the google doc or sheet format, or if even thinsg changed and you have somethin else in mind we can work things out

SG
Sam Gossage
4:56 PM
Can you provide both options to see how they look

Ahmad Basheer
4:57 PM
could u please sam do me a favor, so this is not it,, but this is my little testing for it ... could you do this @agent save file as pdf
and another time @agent save file as csv and tell me if this works for you and also if you want you can do @agent save file as a text document

SG
Sam Gossage
4:57 PM
Yeah

Ahmad Basheer
4:58 PM
i would love to actually do both its just that this is the trickiest part in terms of getting that data and putting in the right plaace and u know basically making it pretty i would love to focus on one for now the priority for you and once we get it done we can move to the neext

SG
Sam Gossage
5:00 PM
Can you come up with an easier scenario where it creates the PDF or Gsheet or Gdoc

It's not formatting very well

Can you test and show me an example

Ahmad Basheer
5:01 PM
yeah yah for sure this is not it,, if this worked for you then perfect but yes for sure this is not what i would give you its just me testing things out

thats why i wante dyou to test,, i dont have currently what it takes to open up those files locally but hwne i was building it did generate a none very good formatted pdf and ok csv and u a really nice .txt 🙂 but yes this is really not this is just me trying to build the foundation for it

i actually have osmething mind but that would kill me its a lot of work lol but let me show anyways ... give me like 5 minutes

SG
Sam Gossage
5:07 PM
All good no stress on the delivery, test out creating a PDF, gslide or gsheet format

If you have it by tomorrow amazing

SG
Sam Gossage
5:19 PM
Can you take a look at my last example for OaktTee where it takes into consideraion more on production than AM/PM hours

Example - OakTree

That's is the way i'd love the model to work

To create more hours across the job in total

Amazing, excited to see the PDF, gslide or gdoc output next 👍

SG
Sam Gossage
5:32 PM
The last 10k audit I checked is unreal, amazing spot on.

If you can show me the output of the Gslide or Gsheet unreal. Spot on mate.

Ahmad Basheer
5:41 PM
https://www.loom.com/share/7e07069a62544999960a637633a2796f?sid=c22e1dc7-6210-4fe1-b35f-144276cd2c62
would you be interested in something like this ?

Create Next App - 29 May 2025
Use Loom to record quick videos of your screen and cam. Explain anything clearly and easily – and skip the meeting. An essential tool for hybrid workplaces.
Loom
SG
Sam Gossage
5:43 PM
Nah it just needs to be a google slide or gsheet/gdoc document with the details in

2 -3 slides

Ahmad Basheer
5:45 PM
awessome just to let you know Sam this is the Gemini 2.5 flash the pro would work way better, this is the best i have tested out of a lot really that can handle things like this first because of huge context window and second its reasining capability so i highly rreccomnd that you get a gemini api and use the pro version

SG
Sam Gossage
5:45 PM
But also an output for the AM's to input the data into our finance system

Ahmad Basheer
5:46 PM
yes sure thing,, will grt right to it,, but i think tomorrow is just such a short notice i will try but i think i would need a bit more time maybe 2-3 days but i will try

SG
Sam Gossage
May 29, 2025 | 5:43 PM
Nah it just needs to be a google slide or gsheet/gdoc document with the details in

Ahmad Basheer
5:53 PM
unfortunately i cant see everything you did, if could please send me the input and output of the Oak and will take a look and tackle these points

Friday, May 30
SG
Sam Gossage
3:49 AM
I can't access the tool anymore due to privacy concerns with the browser

Ahmad Basheer
12:39 PM
https://main-anything-llm.sgvz2y.easypanel.host/ hi sam
sam
112233445566

Monday, Jun 02
SG
Sam Gossage
2:03 AM
image.png 
image.png
Ahmad Basheer
2:25 AM
https://ai-anything-llm.is0dbo.easypanel.host/



sam
11223344

SG
Sam Gossage
10:28 AM
Can you show me an output document?

Tuesday, Jun 03
Ahmad Basheer
10:14 PM
Hi Sam,



Could you share 2-3 input prompts you’d typically use? If you have more and can provide them, that would be great. I understand they differ each time, but I’m looking for the general pattern—things like the expected format, length, and structure.



This will help me refine the document automation process. Let me know whenever you get a chance. Thanks!



Best, Ahmad

Wednesday, Jun 04
SG
Sam Gossage
6:58 AM
Please create me a scope of work for [.... client] to support them with [ .... service i.e. an audit, customer journey mapping, an email template, nurture program for X# of emails and Y# of landing pages, a [platform i.e. hubspot, salesforce] implementation, reporting and analytics. At approximately [ ..... cost]

Please can you just prepare an output format I need to see something that can work even in it's current form based on any prompt being used at the moment.

Thursday, Jun 05
Ahmad Basheer
4:06 AM
Hi Sam, I just wanted to let you know that I’m working hard to ensure everything is error-free and truly helpful. I don’t want you to think I’m ignoring or not responding—I’m fully focused on the project and will update you soon.

SG
Sam Gossage
4:36 AM
Ok thanks look forward to the update

Friday, Jun 06
SG
Sam Gossage
10:52 AM
Hey mate, I really need to see an output on the scoping tool, I know GPT can provide Word outputs etc. It would be great to see some kind of doc.x output or gdoc output using the tool next week by Tuesday if you can provide this.

We have a large number of new scope requests i'd love to use the tool for

Keen to get started on trialing it and seeing the output

Tuesday, Jun 10
SG
Sam Gossage
10:23 AM
Hey can you provide an update today please?

Ahmad Basheer
10:46 AM
Hi Sam can we get on a call ?

Wednesday, Jun 11
SG
Sam Gossage
3:58 AM
Book time with me when available - https://calendar.app.google/9iNWUR6Rr88iAwvd9

Appointment w/Sam - Sam Gossage
Thursday, Jun 12
Ahmad Basheer
7:04 AM
HI Sam

SG
Sam Gossage
7:05 AM
Hi i'm in the call - https://meet.google.com/vaw-iaqk-gxg?authuser=0

SG
Sam Gossage
7:19 AM
i.e. letterhead template for output document - https://docs.google.com/document/d/17nxRg_GBTBsGDC3jAeUsj9yvKWZTE0uj4zE1slyemQY/edit?tab=t.0

Saturday, Jun 14
Ahmad Basheer
2:01 PM
Hi Sam,



Since all you really need is a well-formatted Google Doc, and we're using Gemini for the prompt anyway, I recommend the following approach. It might sound simple, but converting Markdown into a clean, human-readable Google Doc isn’t always straightforward—so why not just use Google directly?



Here’s what you need to do:



Go to Gemini (gemini.google)



Copy & paste the system prompt into a Gem (link below)



Upload the KB document into Gemini



Generate the SOW



Click the three dots and export as a Google Doc—and you're done!



Links:
System Prompt: https://docs.google.com/document/d/1FmNCG1SfBWn5SUDQtEpsUD5N2Uiwo3oEUvX1gBwxnD4/edit?tab=t.0#heading=h.ql23j48n7nsh



Knowledge Base (KB): https://docs.google.com/document/d/10A8hRq8kwXlS1FseOwtDycujwcpG9sgMApeqQbqOJao/edit?tab=t.0



I’ll send you a short video shortly to walk you through it.



Also, Sam—I got so caught up in this that I totally forgot we haven’t even talked about financials. But honestly, I don’t want to complicate things. If you like what you see and appreciate the work, just send me whatever you feel is fair as a contract, and we’ll call it even.



Let me know what you think!



Best

‎Google Gemini
Gemini is your personal, proactive, and powerful AI assistant from Google. Try it for free to help with work, school, and at home for whatever inspires you.
Gemini
Ahmad Basheer
6:46 PM
https://www.loom.com/share/f04113da10e74ae2b899d2a203b62262?sid=2bfb1d93-4fc4-465f-a657-4846f59fcb73

Google Gemini - 14 June 2025
Use Loom to record quick videos of your screen and cam. Explain anything clearly and easily – and skip the meeting. An essential tool for hybrid workplaces.
Loom
Wednesday, Jun 18
SG
Sam Gossage
9:05 AM
Hey on payment can you just bill us for the hours associated to the current job/contract that you already have with George? I don't think this gives me what I want. I'm looking for a more presentable document with the logo attached etc. There's a few rules to add in, I don't want it to be as transcriptive looking at the existing templates and literally copying like for like, I want details to come from the AI model based on best practice setup using web research as well. Our previous line items aren't the necessary layout for everything. On the Account management hours that should as a rule come at the bottom of the roles, not in the middle. I also need to be easily able to play around with the hours and update similar to the way we can do this in the google sheet. Is there a way you can come up with a solution that has an even slightly modified designed excel or google doc that uses our logos and fonts with an output?

Ahmad Basheer
9:24 AM
Hi Sam,



Thanks for the feedback.



We can provide a way for you to modify the output in the interface until you're satisfied with the results, then export the final scope as a branded PDF. A direct-to-GDoc/GSheet export is technically complex and often results in formatting errors, whereas the PDF route ensures the layout and branding are perfectly preserved for a client-ready document.



To clarify, the AI is using the same prompt and setup that you previously tested and approved for us to move forward. Were the results you saw this time different from that test? Knowing what changed in the output will help me address it.



Regarding your new requests for web research and specific role ordering, these can be built into the logic. If the PDF export approach works for you, I can proceed with implementing those adjustments.



Let me know if you'd like to proceed.



Best regards,

Ahmad Basheer
9:46 AM
will something like this be okay ?

image.png 
image.png
SG
Sam Gossage
9:49 AM
Can we have a call now

Ahmad Basheer
9:50 AM
yes sure

SG
Sam Gossage
9:50 AM
https://meet.google.com/cqw-aezg-hug?authuser=0

Yeah the above screenshot looks good

Yeah PDF is fine

SG
Sam Gossage
10:11 AM
Example PDF - https://docs.google.com/document/d/1EbjFVj8EpfVwM_HvwAeQOvA4WLqybRljmLX5uqa4_4M/edit?tab=t.0

SG
Sam Gossage
10:47 AM
some banners

drive-download-20250618T062119Z-1-001.zip 
drive-download-20250618T062119Z-1-001.zip
188 kB
SG
Sam Gossage
11:07 AM
Logo Dark-Green.png 
Logo Dark-Green.png
Thursday, Jun 19
SG
Sam Gossage
8:06 AM
Hey mate, how are you going on the PDF output format? Would be good to use the tool for a couple of scopes I've had this week?

Ahmad Basheer
8:22 AM
Hi Sam just a few more tweaks and i'll be done https://www.loom.com/share/218a874e8e0142eca708bb4be036ed89 let me know what you think and if you have any notes

Failed to load the video
SG
Sam Gossage
10:42 AM
Ok please send across the link to the tool when complete and i'll check the output for myself then let you know

Ahmad Basheer
1:14 PM
https://sam-sam.vo0egb.easypanel.host/

Social Garden - SOW Generator
Ahmad Basheer
1:20 PM
Hi Sam,



Here you go! Let me know your thoughts and how you'd like to move forward.



At this stage, the tool functions the same way it did in the chat — with the addition of search capabilities. Rather than relying heavily on the knowledge base alone, it now blends search-driven responses with best-practice content from the KB.



I’ve also created two PDF templates, a spreadsheet export, and a shareable URL feature. Each shareable link is unique, and before sharing it, you’ll have the option to toggle whether you want AI chat support enabled.



Right now, the AI chat support is trained on a few basic inputs related to Social Garden, but it's fully customizable and can be trained on any content you provide.



Looking forward to your feedback — thanks again!

Friday, Jun 20
SG
Sam Gossage
4:28 AM
Hey the first test I ran it didn't work or add any hours or amount -

image.png 
image.png
So the output PDF looks good now but the actual scope details and hours and rates aren't working properly

Basically you need a combination of the gemini one you had and this with the output

The timeline details and the line items are messy in regards to the format and layout for this version as well

Ahmad Basheer
8:44 AM
Hey Sam, I’ll take care of this—thanks



I've been sketching out a few ideas and enhancements that I think could really add value, but before I dive into building some more, I want to make sure it’s genuinely useful and aligns with the way your team works.



If you’re comfortable sharing, even just a quick rundown of your current workflow—from how a lead typically comes in (whether via prospecting or inbound) to the steps leading up to sending the SOW—would help a lot. I don’t want to be too nosey here, so totally up to you, but knowing what tools you're using (like HubSpot, if that’s the case) and how your process flows would let me tailor something that’s truly dialed in for your needs.



Appreciate anything you're happy to share!

SG
Sam Gossage
11:52 AM
Hey this is becoming a bit cumbersome now I just want a working model TBH mate instead of going back and forth on calls with it not working

I've been trialing out the gemini version, here's a few updates: currency should be AUD not USD. It should as a standard try to keep to round numbers i.e. 200, 250, 300 hours for the total scope / or round numbers on the final amount i.e. 50k, 45k, 60k etc. etc.

I need an easy way to prompt to update the same scope hours and roles and tasks, gemini wasn't updating the scope correctly when I was asking for it to be i.e. 50k as a total for instance.

At the moment i'm having to spend way too long on formatting if I put it into a google doc for a pdf extract. Can we have a rule that the copy is in plus jakarta sans font

Here's an example of a scope of work I worked on, it took way too long 2hours to get to this result with the formatting and it's super difficult when trying to edit any hours or the full amount. Gemini just doesn't listen or update to the requested amount.

Scope of Work_ Western Sydney University - HubSpot CRM Implementation for Partnerships & BD Team (1).pdf 
Scope of Work_ Western Sydney University - HubSpot CRM Implementation for Partnerships & BD Team (1).pdf
184 kB
I need a version of the scoping tool that is a combination of the gemini version you had before with the output to basically create the PDF doc

Wednesday, Jun 25
SG
Sam Gossage
2:47 AM
Hey Ahmad?

Ahmad Basheer
10:42 AM
Hi Sam — Quick update: I ran into some unexpected tech issues — nothing major, but enough to delay things slightly. I’m on top of it and moving fast to wrap everything up. You’ll have the final project very soon — aiming for today, but if things get tangled again, tomorrow at the latest. Thanks for hanging in there.

Monday, Jun 30
Ahmad Basheer
7:07 PM
Hi Sam,



I hope you're doing well and that your team at Social Garden is hitting its stride. Let me begin by apologizing for the delays in delivering this scoping tool—it's not the reliability I aim for, and I know how much that can throw off momentum. That said, it wasn't from slacking off; this is a complex undertaking that required deep research into best practices and persistent fixing of technical hurdles to get it just right. But now that's all sorted, and I'm thrilled to share something I'm really proud of.



What I've built is a powerful, user-friendly system that brings AI to life in a way that's both intuitive and insightful. It's like having a top-notch collaborator that shows its internal thought process step by step—handling the intricacies of your briefs, making bespoke adjustments on the fly, and even self-evaluating for accuracy. Watching it navigate complexity, refine details, and ensure everything's tailored perfectly is genuinely fascinating, and it's a feature I'm especially proud of because it makes the whole experience so reliable and engaging.



The interface is familiar, similar to what you've used with ChatGPT, but customized for seamless scope creation, including interactive editing and easy PDF exports. It's highly extendible too, with the AI engine capable of adapting to other tasks, like managing requests from team members (though I couldn't connect with George, so we can revisit that). Plus, every table can be exported as CSV for your finance team.



Just to be clear, this is strictly a testing version and not for full use—once you're ready, grab an API key, and I'll set it up for a more robust experience. Here's the link to dive in: https://socialgarden-ollama-web.vo0egb.easypanel.host/



Username: sam@socialgarden.au
Password: 11223344
Even though it's straightforward to use, I'll take a quick recorded video walkthrough and share it with you shortly to make sure you're all set.
I'm confident this will be a game-changer for you. How about we schedule a call to discuss your initial thoughts?



Best regards,
Ahmad Basheer

Ahmad Basheer
7:36 PM
video 1 https://www.loom.com/share/defa91c8f02648268fe813c8c15a8e74?sid=223bf970-fec5-4f74-a59f-02825093486a

Ollama (Open WebUI) - 30 June 2025
Use Loom to record quick videos of your screen and cam. Explain anything clearly and easily – and skip the meeting. An essential tool for hybrid workplaces.
Loom
Ahmad Basheer
7:45 PM
You removed this message

Friday, Jul 11
SG
Sam Gossage
5:49 AM
Hey i've tried using this a few times and it's not working for me at the moment

Can you just try to create a version that has an output into a Google sheet for me?

Ahmad Basheer
5:50 AM
Hi Sam do you mean access wise>?

SG
Sam Gossage
5:50 AM
LEt's not try to overcomplicate it at the moment if you can

Nah just actually running the AI model and when I try to request a scope

It just doesn't run/work after inputting the prompt

I've been trying to use the old Gemini version that you can move to a Gdoc

That is the only working option at the moment that has been close to working correctly, my concern with that version at the moment is it's so hard to make quick changes to the table of pricing and hours easily, having to go back in and run a prompt, it'd be great if the output was into a Gsheet formatted so we can just go in and modify the roles and hours to make quick updates manually if necessary

Ahmad Basheer
5:55 AM
you are goimg to love this one sam the last i gavemm give me a moment i will take video were u trying todo this I need you to review the files attached and the brief to create a scope of work based on an audit and then MAP implementation for TAFE Queensland

Ahmad Basheer
6:49 AM
https://www.loom.com/share/ce5108b4447b422993b16811bfe8f50e method one word doc


Ahmad Basheer
8:32 AM
method 2 the html https://www.loom.com/share/d84be9ee2f9b4c05b60cae6293826046


Ahmad Basheer
9:21 AM
method 3—the CRM flow: 👉 https://www.loom.com/share/a3e585eb9e38468b8e926dda6c60d06e?sid=4f9a7215-1849-4d84-862c-e5a445c8dc8d It supports both PDF generation and a shareable link. If your CRM allows for embedded documents, this flow can fully handle delivery too.



Here’s what’s now live:



Word doc output (first video)



HTML-to-PDF method (second video)



CRM-based method – PDF + shareable link



This gives you full flexibility to deliver and structure scopes however you prefer. Everything is built and running clean.



Please note:



There are some small formatting issues in the PDFs that I can fix—but only after you approve the flow 100%, so I know exactly how to lock it down.



Please do watch the videos—they’re short but important for understanding how the flow operates.



I’m currently using free-tier APIs, so during your own testing, expect rate limits or slower performance. When you’re ready, you can plug in your own Gemini Pro 2.5, Grok 3, or even Grok 4 key (which just dropped and is insane). I’ll wire it instantly once you have one.



Looking forward to hearing your thoughts. Let me know once you’ve reviewed everything.



— Ahmad

📋 TAFE SOW Research • Ollama (Open WebUI) - 11 July 2025
Use Loom to record quick videos of your screen and cam. Explain anything clearly and easily – and skip the meeting. An essential tool for hybrid workplaces.
Loom
Friday, Sep 05
SG
Sam Gossage
3:20 AM
Hey i'd like to revisit this, but try to use an AI agent to fill in or update a google sheet version of the scope of work instead. The previous models haven't worked as expected or been able to provide an output that can work in a scalable and easy to update and modify way. The closest was the Gemini model but the problem with it was the output being a static Google doc or PDF so when trying to update the tasks / hours and pricing it is really difficult based on clients bespoke requests. Can you confirm if we can try to get a working AI Agent model whereby we can use prompts to have an agent fill out the details and update a Gsheet that's more easily customisable?

Ahmad Basheer
4:40 AM
but u dont understand i gave him something beautifukl idk what he means by static like look

SG
Sam Gossage
5:57 AM
?

I need something that's easy to modify and update

Just looking to re do this and have something which updates a Gsheet so it's easily customisable after the scope has been completed via the AI prompt.

Ahmad Basheer
3:41 PM
Hey Sam,



My apologies—you accidentally got a raw note-to-self. I was just mapping out the project specs.



Yep, the Google Sheet approach is definitely achievable. The AI engine I already built is designed for this and can be pointed directly at a GSheet.



I can get started on it as soon as we formalize the project.



To do that, the only thing I need is a link to your ideal Google Sheet template (with the exact columns and tabs).



Once you send that over, I'll put together a fixed-price proposal for you right here on Upwork.



Best, Ahmad

Wednesday, Sep 10
SG
Sam Gossage
7:03 AM
The google sheet is the same one I sent you before as an example

SG
Sam Gossage
7:10 AM
So I would need it to update the name of the scope, the whole section of the overview, what the scope includes, outcomes of the project and scope assumptions then for each individual scope of work create a different sheet that pulls into the summary. On the second sheet as an example it has all of the "roles"/ "tasks" outlined with hours associated and the deliverables then deliverable assumptions for that piece of work. You can come up with a different format if you like but the concept of updating the scope within a Gsheet document instead of having a PDF or word doc and having the hours and roles be easy to modify in the future is the important part of the output then if the deliverables and overview can be filled in by AI based on the prompt that would be great.

AI TEMPLATE SHEET_ Social Garden Design MA Scoping 2025 [Please make a copy].xlsx 
AI TEMPLATE SHEET_ Social Garden Design MA Scoping 2025 [Please make a copy].xlsx
81 kB
Ahmad Basheer
11:36 PM
Hey Sam,



Quick heads up: to properly build and test this workflow, I need an API key for Gemini Pro 2.5 or one of the Grok models (3 or 4). Right now, I’m forced to use free-tier models for testing, which means limited performance and frequent truncated outputs—not representative of what this system can actually do.



To get you the results you’re expecting (and test it under real usage conditions as your end-users would), I need access to a proper API key. As soon as I have that, I can push forward, nail the setup, and show you exactly how it’ll work in production.



Let me know if you can provide one of those, and I’ll get this sorted.



Best,
Ahmad

Thursday, Sep 11
SG
Sam Gossage
4:43 AM
Hey I don't believe we have a SG gemini pro 2.5 account or grok 3 or 4. I'll do some digging to check, if not can you use ChatGPT 5

This ok for gemini:

Sam Gossage removed this message

AIzaSyAJYTnlWy14JfmGQ4dAwUdbecanrSYZKKA

or this: AIzaSyD7pjyTypnYcg6fvwZDD7a9eT8yOf88PMA

Sunday, Sep 14
Ahmad Basheer
12:18 PM
Hi Sam,



Do you have Google Workspace (for your company domain)? I need to set up something that’s a bit involved—the Google service account with domain-wide delegation. It can get confusing and isn’t a simple one-click task.



If you can give me access to a temporary email under your company’s domain, I can take care of the whole setup myself and spare you the hassle. Let me know if that’s possible or if you’d prefer to walk through it together.

Monday, Sep 15
SG
Sam Gossage
9:20 AM
Could you send me your email address and I'll request an account from our IT administrator? Cheers

Ahmad Basheer
6:13 PM
hi Sam its ahmadbasheerr@gmail.com

Message Blocked
We didn't send this message because it includes an email address. You can only share this after a contract starts. Review our policy for details.
hi Sam its ahmadbasheerr @ gmail.com

Gmail
Gmail is email that’s intuitive, efficient, and useful. 15 GB of storage, less spam, and mobile access.
Tuesday, Sep 16
SG
Sam Gossage
2:29 AM
Cheers I've requested access

Wednesday, Sep 17
SG
Sam Gossage
7:04 AM
You should have access to a gmail account now.

Ahmad Basheer
7:07 AM
Hi Sam well received, Thanks!

Thursday, Sep 18
SG
Sam Gossage
2:54 AM
Can you confirm your approach now and if it’s possible? We can schedule a call to discuss if you like?

Ahmad Basheer
12:46 PM
Hi Sam,



Quick update: the main system is fully built out—the only thing still fighting me is the final Gsheet setup. Everything else is ready to go; it’s just this last piece that refuses to cooperate, but I’m on it.



I’ll keep you posted as soon as it’s squared away. If you’d still like to chat or check in before then, just let me know and I’m available.



Best,
Ahmad

Friday, Sep 19
SG
Sam Gossage
8:50 AM
Ok thanks yeah let me know next week if you want a call

Ahmad Basheer
8:54 AM
Hi Sam i just sent this to Tom, Could you please let me know Hi Tom, I'm currently working on something for Sam, and I wanted to check with both of you—what should I prioritize? Both tasks will take roughly the same amount of time, around three days.

each

SG
Sam Gossage
9:00 AM
You can prioritise Tom's

We can have the call on Thurs or Friday after Tom's if you can. Let's still connect so I can understand your thoughts and the issues and then discuss the hourly rate or fixed rate etc.

Ahmad Basheer
10:07 AM
You removed this message

Tuesday, Sep 23
Ahmad Basheer
4:04 PM
Hi Sam I've got a working solution and would like to show you and discuss it. Let me know when you're available.

Wednesday, Sep 24
SG
Sam Gossage
2:13 AM
Can you meet me this afternoon at 3:30pm AEST?

Sent you an invite

SG
Sam Gossage
8:29 AM
In the call now - https://meet.google.com/gmo-mdno-fcd

Hey i need to go to another call now. I will move to tomorrow please check the your email address for the invite

Thursday, Sep 25
Ahmad Basheer
8:24 AM
Hi Sam,



I had the perfect MVP ready to show you, but unfortunately, I lost access due to hosting limitations. I’m working on getting it back up and running—it should only take a few hours. I’ll get in touch as soon as it’s restored.



I’ve also contacted George and Tom to purchase backup services from the hosting provider so we don’t run into this issue again, regardless of the project.

SG
Sam Gossage
8:26 AM
Ok so do you want to cancel this scheduled sync till that’s sorted?

Tom is on annual leave at the moment so if you can prioritise my work till he’s back that would be great

Ahmad Basheer
8:28 AM
I would love it Sam if we could stay in sync throughout the next 2-3 hours here because i can get it running soon, and mioght need yout input of course if you have time and then moment its runing pleas we can get on a call is possible also regarding george and tom please i sent them this,,, if they arnt able to see it please deliever the message "Hi Tom, George,



It’s essential that we purchase the backup services from Hostinger ASAP. George, either you’ll need to log in and buy it directly, or give me the go-ahead to handle it.



Also, I’ve just realized I have access to your billing area (see the attached screenshot). For your security, please revoke my billing permissions—I’m currently able to make purchases with your card. Go into your admin panel, update my access so I only have technical/admin rights (not billing), and double-check all user roles.



This is for your protection. Thanks"

SG
Sam Gossage
8:29 AM
I go offline in 1 hour and half and have an event this evening

Ahmad Basheer
8:30 AM
i'll try to catch you before that

SG
Sam Gossage
8:30 AM
Otherwise I can meet you tomorrow

Ok thanks

Friday, Sep 26
SG
Sam Gossage
6:30 AM
Hey do you have a status update?

Ahmad Basheer
9:00 AM
Hi Sam yes I do! im ready to jump on a call whenever you can let me know

SG
Sam Gossage
9:49 AM
Lets meet Monday afternoon now, scheduling a call

Ahmad Basheer
9:58 AM
Hi Sam,



I finally got everything working and I’m excited to show you. It would be great if you could spare a few minutes to catch up today—just let me know when you’re free.



Thanks

SG
Sam Gossage
1:14 PM
I’m at an event tonight i’ve scheduled a call for Monday chat then 👍

Monday, Sep 29
Ahmad Basheer
2:16 PM
Hi Sam what do you think? if you have anything in mind please let me know Thanks

2 files 

image.png
92 kB
BBUBU - HubSpot Integration and Custom Landing Page Development for BBUBU_Export_2025-09-29 (4).pdf
37 kB
Tuesday, Sep 30
SG
Sam Gossage
2:39 AM
Yeah I think that's good I could see it working, is there no way we can use the actual Social Garden logo for the extract instead of text at the top though?

SG
Sam Gossage
5:08 AM
Oh can we move the "Devlierables" underneath the scope overview before the role/tasks and rate. Then this is good I think

SG
Sam Gossage
6:42 AM
Let me know when you can provide the login and I can test out for myself to give it a go

Ahmad Basheer
9:24 PM
Hi Sam, you can test it here:
http://168.231.115.219:3009/workbench



Please let me know ALL your feedback—good, bad, new features, whatever. I’m totally open.

Social Garden - SOW Workbench
AI-powered generation and editing of professional Scopes of Work using Grok AI
Wednesday, Oct 01
SG
Sam Gossage
10:00 AM
Hey the link doesn't work for me?

Ahmad Basheer
10:03 AM
plz try now

Ahmad Basheer
10:26 AM
can you confirm i f it opened for you please

SG
Sam Gossage
10:48 AM
It's not working for me when I try to use it

Clicking new scope doesn't work

Shows errors

Ahmad Basheer
11:02 AM
Hi Sa sorry about that it should now work
ACCESS URL:
http://168.231.115.219:3009/workbench

Social Garden - SOW Workbench
AI-powered generation and editing of professional Scopes of Work using Grok AI
SG
Sam Gossage
11:38 AM
Stil not working

Please test and trial, I just need something I can come to and use easily over and over again that's reliable. Let me know once ready if you need time for tomorrow

image.png 
image.png
Ahmad Basheer
1:06 PM
https://demo.qandu.me/workbench Hi Sam this is it

Social Garden - SOW Workbench
AI-powered generation and editing of professional Scopes of Work using Grok AI
Ahmad Basheer
1:18 PM
To kick things off, just chat with the AI here about what you want. Give it your client name and a brief. The AI will guide the planning and ask smart questions to clarify details. When you're ready, just click / and select "Build SOW"—the system will automatically use everything from our conversation to draft your Statement of Work.

Ahmad Basheer
3:36 PM
Hi Sam,
Could you please share your feedback when you get a chance? If possible, I’d appreciate it today, as I’m hoping to wrap things up with you and George regarding these two projects. Thanks so much!

Thursday, Oct 02
SG
Sam Gossage
2:40 AM
Hey there's quite a few bugs and issues with it

I'll send feedback later today.

- Text is transparent on the chat function - X (looks fixed now)
- Buggy on the left hand side jumping around
- There isn't enough detail in the description and the line items. -> Can we train the model to look at the old Scopes of work and the detail I sent you before when we worked on the gemini AI model.
- The roles/tasks aren't being allocated correctly and there isn't enough of them shown as per the other examples I sent you before. In my test version of the scopes it comes out with one job/task role and then one account management role but there's a number of project coordination, design, dev, deployment etc. Required for the scopes.

- My folder for Sam's Tests disappeared and i've lost previous scopes -> need to make sure they stay so I can go back to edit

SG
Sam Gossage
Oct 2, 2025 | 2:45 AM
- My folder for Sam's Tests disappeared

- It's not listening to the budget I listed i.e. 10k for an email template it came back with a way over the top 35k S.O.W

The export itself as a PDF looks good but the columns need to be spaced out and then let's add +GST to the summary -

image.png 
image.png
- I used the drop down to select a different task/job for design and it didn't change or work

- I need to be able to move around the layout of the role's, i.e. drag and drop the layout if we can as they are coming out sporadically and we want to show them in a certain format based on when the services will be delivered

- Deliverables should be laid out i.e:



"
Hubspot Implementation & Configuration Deliverables
1x Marketing, Service & Content Hub Implementation



Marketing Hub Enterprise Setup with 10,000 Marketing Contacts + 90,000 Additional Marketing Contacts & 5x Core Seats
6x Core Enterprise Seats
3x Content Hub Professional Seats
2x Service Hub Enterprise Seats



Initial Account Configuration
+ General settings setup & Multi-brand kit configuration (e.g., OSHClub, Helping Hands Network)
+ Testing sandbox setup if available via HubSpot package
+ ERD diagram & data dictionary for AU configuration
+ Setup of standard and custom objects and properties related to the contact marketing requirements



Marketing Hub Implementation
+ Planning workshop to define setup
+ Set up website tracking and prepare instructions for client's web team to add to website or Google Tag Manager
+ Domain validation process and email sender domain verification
+ Example segmentation strategy & view setup (i.e. Properties on record views & Stage, Buyer Type List Views)
+ 1x Master email template migration from existing system
+ 2x workflow journey examples with a training session on how the team can setup a workflow



Service Hub Implementation
+ Configure inbox message routing fo supported regions
+ Create ticket pipelines for:
 – CX / incident resolution
 – Program feedback and service requests
+ Custom ticket properties for incident type, SLA compliance, and resolution stage
+ Automated ticket routing & escalation rules for per region



Reporting and Dashboards
+ Build custom reports and x2 dashboards covering:
 – Website Analytics
 – Marketing & lead gen performance



Training & Onboarding:
+ 4x Training or workshop sessions for marketing and CX teams on HubSpot setup and usage
+ User setup & group configuration for users in platform.



Go-Live and Deployment:
+ Final import of contact data
+ Map data to relevant objects and properties
+ Final UAT & QA checks before deployment
+ Execute go-live process for multi-region configuration
+ Handover documentation (GSlides) outlining setup, configuration, and usage guidelines



Account & Project Management Services
+ Kick-Off, Project Status Updates, Internal Project Briefing & Project Management
"



Not just a paragraph of text but listed deliverables.

Or i.e. for an Email Template Build:



"Email Template Build
1x Master Email Template design, development & deployment
Template can be used within HubSpot for any email programs and campaigns the client would like to setup post implementation.



Design
+ Defining the max 1x email template style & brand (multi-brand variants: OSHClub, Helping Hands Network)
+ Email Template Wireframe Design
+ UX Design: Modular prototype in Figma (Max: 4 blocks, 30 modules)
+ Client Review & Template Approval



Development
+ Email Template Development Design Review
+ Email Template Development
+ Email Template Testing & Rendering Across Different Devices
+ Email Template QA Check



Deployment
+ Email Template Deployment into Marketing Automation Platform
+ Email Template UX and UAT Review
+ Final email template client approval and handover



Account Management & Project Management Services:
+ Kick-Off (Internal Initiation) Meeting, Project Status Updates, Internal Project Briefing & Project Management "

- Excel extract button doesn't work and the PDF extract button didn't work when I went back and edited an old version to extract again

Ahmad Basheer
3:09 AM
Thanks for the thorough feedback. I’ll be taking care of the points you listed. One thing to note—a big part of the current limitations came from the Gemini APIs you provided being rate limited, so I had to switch to OpenRouter. If you can register for OpenRouter and top up a few dollars, you’ll have access to Gemini and more options. I highly recommend this for getting the detail and functionality you’re after.

SG
Sam Gossage
3:49 AM
Ok please detail how we can go about that and the cost

Ahmad Basheer
3:53 AM
https://openrouter.ai/settings/keys you would need to quickly sign up and and then go to credits purchase some then go to keys create a new one and provide the api key

Ahmad Basheer
8:24 AM
Hi Sam,



Great news! I’ve systematically addressed every issue you raised. Here’s your complete status update:



✅ ALL ISSUES RESOLVED



UI/Stability Fixes:



✅ Text transparency in chat → Fixed



✅ Left sidebar jumping → Eliminated all animations causing flickering



✅ Missing folders/lost SOWs → Persistence now working properly



✅ Export buttons (PDF/Excel) → Both functioning correctly



✅ Role dropdown → Selection now operational



✅ Drag-drop role reordering → Implemented for custom sequencing



Content Quality Improvements:



✅ SOW Detail Quality → Major breakthrough: SOWs now generate with comprehensive, agency-grade detail



✅ Deliverables Formatting → Perfect bullet-point structure matching your HubSpot/Email examples



✅ Role Allocation → Context-aware system generating 6+ relevant roles per scope based on project requirements



✅ Budget Constraints → AI now respects specified budgets



✅ PDF Formatting → Enhanced spacing, professional styling, proper GST display



🎯 Key Achievement:
The system now generates professional, detailed SOWs with:



Industry-specific terminology and expertise



Structured deliverables with correct bullet formatting



Contextually-appropriate role allocation (generating roles matched to your specific needs)



Accurate budget handling



Agency-quality presentation



📊 Results:
11 out of 11 issues fully resolved (100% complete)



The platform is now stable, professional, and generating consulting-grade SOWs ready for your client delivery needs.



Test all improvements here: https://demo.qandu.me/workbench



If you have any feedback or want further tweaks, just let me know—I’m here and ready to make any last adjustments.



Best regards,
Ahmad

Social Garden - SOW Workbench
AI-powered generation and editing of professional Scopes of Work using Grok AI
Ahmad Basheer
9:40 AM
Hi Sam this is just mock now but i just wanted to share my ideas of how you can take this further think client portal AI powered and all

Recording 2025-10-02 093900.mp4 
Recording 2025-10-02 093900.mp4
5 MB
Friday, Oct 03
SG
Sam Gossage
10:03 AM
Thanks didn't get a chance to test again today. I'll do some more robust testing next week and come back with any feedback! Cheers!

One thing we do need to add however is the option for % discount -> This could be % across an individual S.O.W or across the total S.O.W itself

So a cell or tav to apply discount to the scope and to show the discount if you can add that in the meantime

SG
Sam Gossage
10:16 AM
Ah on the GST it should say +GST in the summary price on each not including at the bottom as well

I've got an example of a scope of work where I need to show three options and don't want to show the final summary price at the bottom, can there be a button to toggle on and off the summarised price of all scopes of work in the editor so I can just show each of the individual S.O.W prices as options without the total as well if needs be

Here's some deliverables for our support retainer scopes of work as well if this can help the model so it uses these as examples for deliverables that would be good:



Larger support retainer:
"Managed Services: Monthly Support Retainer:
(Services may include the below)



Ticketing System Setup: Implementation of a Google form to Asana ticketing system to streamline support requests, issue tracking, and resolution when working with us.



User Support: Assistance for users with questions, troubleshooting, and guidance on using platform features and tools.
Technical Support: Resolving technical issues or bugs within the platform.
Platform Updates and Maintenance: Providing platform recommendations and updates based on features.
Email & Content Support: Creation, testing, and optimisation of email templates and content blocks.
Campaign Management: Assistance with the review of and optimisation of marketing campaigns.
Database Management: Assistance with the creation and management of objects, properties/fields and values.
Lead Management and Sales Pipeline Optimisation: Assistance in managing leads, optimising the sales pipeline, and leveraging better lead nurturing strategies.
Reporting and Analysis: Assistance in creating custom reports, analysing data, and generating insights to optimise marketing and sales performance.
Integration Support: Assistance with integration setup, troubleshooting, testing, monitoring and fixing.
Testing and Optimisation (e.g., A/B Testing): Support with A/B tests to optimise various elements like emails, landing pages, and CTAs.
List Segmentation and Management: Assistance with creating and managing lists and segments for targeted marketing efforts.
Workflow and Automation Configuration: Review and optimisation of workflows and automations.
Customisation and Personalisation: Creating custom fields and supporting field merges and other personalisation tactics.
Documentation and Knowledge Base Maintenance: Providing guides and resources for users when necessary.
Training Services: Conducting training sessions for users to enhance their understanding and proficiency; Providing customised training programs based on user needs and roles.



Account Management: Dedicated Account Manager leading communication, work-in-progress meetings, sprint planning, and providing status updates.
Project Management Services: Project Coordinator managing internal project management and task triage for the support retainer."



Smaller hour support retainer:



Managed Services: Monthly Support Retainer:
(Services may include the below)



Ticketing System Setup: Implementation of a Google form to Asana ticketing system to streamline support requests, issue tracking, and resolution when working with us.



User Support: Assistance for users with questions, troubleshooting, and guidance on using features and tools.
Technical Support: Resolving technical issues and supporting extra requests and troubleshooting details within the marketing automation platform.
Lead Management and Sales Pipeline Support: Assistance in managing leads, optimising the sales pipeline, and leveraging better lead nurturing strategies.
Reporting and Analysis: Assistance in creating custom reports, analyzing and updating the data model.
List Segmentation and Management: Assistance with creating and managing lists and segments for targeted marketing efforts.
Basic Integration Support: Troubleshooting integrations setup and providing guidance.
Workflow and Automation Configuration Support: Review and optimization of workflows for both marketing and sales processes.
HubSpot Academy Guidance: Providing guides and training links for users when necessary.



Project Management Services: Project Coordinator managing internal project management and task triage for the support retainer.

SG
Sam Gossage
10:29 AM
For support retainers we usually use these tasks and hours and scale them up and down accordingly, this is for a 40 hour retainer:



Tech - Producer - Support & Monitoring 10 10.00 $120 $1,200
Tech - Specialist - Database Management 10 10.00 $180 $1,800
Tech - Sr. Consultant - Advisory & Consultation 10 10.00 $295 $2,950
Tech - Head Of - Senior Project Management 2.5 2.50 $365 $913
Tech - Delivery - Project Coordination 2.5 2.50 $110 $275
Account Management - (Account Manager) 5 5.00 $180 $900

FYI folder drag and drop didn't work to move scopes into folders

Ahmad Basheer
5:14 PM
Hi Sam, I’ll take care of everything and deliver a great end product. Previously, you mentioned George would handle the contract, but he’s not being responsive. If you or George can formalize this here, that would be great.

Tuesday, Oct 07
Ahmad Basheer
6:23 AM
Hi Sam,



Just checking in to see if you’re still interested in moving forward with this. I haven’t heard back lately, so let me know if you’d like to continue or if there are any updates from your side.



Thanks!

SG
Sam Gossage
7:48 AM
Hey yeah sorry we had a public holiday yesterday

So you have made the changes and updates? I'll have a chat internally with George and come back to you on that tomorrow then

Ahmad Basheer
8:39 AM
Hi Sam,



I’m good to go on your updates—the only thing I’m waiting on is the OpenRouter API key. Once you send that over, I can jump straight in.



And if you’re able to finalise the contract details today as well, that would just help keep things organised on both sides.

Ahmad Basheer
8:52 AM
$20 credit lets you test all the main models—Gemini, Claude, Grok, GPT-4o—and see what works best with multiple SOWs. $10 is enough if you just want to stick with Gemini or basic testing. Decide what suits you, top up, and send me the API key.

Wednesday, Oct 08
Ahmad Basheer
12:24 PM
Hi Sam could you update me please

Thursday, Oct 09
SG
Sam Gossage
2:08 AM
Hey mate, ok cheers, George is out on annual leave for the next three days, i'll connect with him early next week and come back to you.