"""
Script to build and enrich social_communication.owl with scenario-aware,
context-aware, and intent-aware domain knowledge for TalkWise.
"""

import os
from owlready2 import (
    get_ontology, Thing, ObjectProperty, DataProperty,
    NamedIndividual
)

def build_ontology():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    owl_file_path = os.path.join(base_dir, "social_communication.owl")
    
    # Load ontology
    onto = get_ontology("file://" + owl_file_path.replace("\\", "/")).load()
    
    with onto:
        # 1. Base Classes
        class SocialRole(Thing): pass
        class Teacher(SocialRole): pass
        class Parent(SocialRole): pass
        class Peer(SocialRole): pass
        class Stranger(SocialRole): pass

        class SocialContext(Thing): pass
        class TeacherContext(SocialContext): pass
        class ParentContext(SocialContext): pass
        class PeerContext(SocialContext): pass
        class StrangerContext(SocialContext): pass
        class MealContext(ParentContext): pass
        class ClassroomContext(TeacherContext): pass
        class PlaygroundContext(PeerContext): pass

        class CommunicationScenario(Thing): pass

        class CommunicativeIntent(Thing): pass
        class AnswerQuestion(CommunicativeIntent): pass
        class TaskCompletionConfirmation(CommunicativeIntent): pass
        class IncompleteTaskReport(CommunicativeIntent): pass
        class PoliteRequest(CommunicativeIntent): pass
        class PoliteInterruption(CommunicativeIntent): pass
        class ContextualRequest(CommunicativeIntent): pass
        class SafetyRefusal(CommunicativeIntent): pass
        class UncertaintyResponse(CommunicativeIntent): pass
        class PeerInvitationAcceptance(CommunicativeIntent): pass
        class PoliteRefusal(CommunicativeIntent): pass
        class CooperativeSuggestion(CommunicativeIntent): pass
        class HonestApology(CommunicativeIntent): pass
        class StrangerCompliance(CommunicativeIntent): pass
        class HostileRefusal(CommunicativeIntent): pass
        class DisrespectfulInformal(CommunicativeIntent): pass

        class LinguisticFeature(Thing): pass
        class HonorificMarker(LinguisticFeature): pass
        class RefusalMarker(LinguisticFeature): pass
        class TrustedAdultReference(LinguisticFeature): pass
        class ExcuseMeMarker(LinguisticFeature): pass
        class FirstPersonStateMarker(LinguisticFeature): pass
        class TimeExtensionMarker(LinguisticFeature): pass
        class SlangMarker(LinguisticFeature): pass

        class Utterance(Thing): pass
        class Response(Thing): pass

        # 2. Object Properties
        class hasSocialRole(ObjectProperty):
            domain = [CommunicationScenario]
            range = [SocialRole]

        class inSocialContext(ObjectProperty):
            domain = [CommunicationScenario]
            range = [SocialContext]

        class expectsIntent(ObjectProperty):
            domain = [CommunicationScenario]
            range = [CommunicativeIntent]

        class allowsAlternativeIntent(ObjectProperty):
            domain = [CommunicationScenario]
            range = [CommunicativeIntent]

        class violatesScenario(ObjectProperty):
            domain = [CommunicationScenario]
            range = [CommunicativeIntent]

        class requiresFeature(ObjectProperty):
            domain = [CommunicationScenario]
            range = [LinguisticFeature]

        class appropriateFor(ObjectProperty):
            domain = [CommunicativeIntent]
            range = [SocialContext]

        class violates(ObjectProperty):
            domain = [CommunicativeIntent]
            range = [SocialContext]

        class hasIntent(ObjectProperty):
            domain = [Utterance]
            range = [CommunicativeIntent]

        class usesFeature(ObjectProperty):
            domain = [Utterance]
            range = [LinguisticFeature]

        # 3. Axiomatic Utterance Classes
        class TeacherPoliteUtterance(Utterance):
            equivalent_to = [
                Utterance & usesFeature.some(HonorificMarker)
            ]

        class StrangerSafetyUtterance(Utterance):
            equivalent_to = [
                Utterance & usesFeature.some(RefusalMarker) & usesFeature.some(TrustedAdultReference)
            ]

        class ParentPoliteInterruptionUtterance(Utterance):
            equivalent_to = [
                Utterance & usesFeature.some(ExcuseMeMarker)
            ]

        # 4. Context Individuals
        teacher_ctx = onto.TeacherContext("TeacherContextInd")
        parent_ctx = onto.ParentContext("ParentContextInd")
        peer_ctx = onto.PeerContext("PeerContextInd")
        stranger_ctx = onto.StrangerContext("StrangerContextInd")
        meal_ctx = onto.MealContext("MealContextInd")

        # 5. Social Role Individuals
        role_teacher = onto.Teacher("TeacherRoleInd")
        role_parent = onto.Parent("ParentRoleInd")
        role_peer = onto.Peer("PeerRoleInd")
        role_stranger = onto.Stranger("StrangerRoleInd")

        # 6. Intent Individuals & Context Relations
        intent_answer_q = onto.AnswerQuestion("intent_AnswerQuestion")
        intent_answer_q.appropriateFor.extend([parent_ctx, teacher_ctx, meal_ctx])

        intent_task_comp = onto.TaskCompletionConfirmation("intent_TaskCompletion")
        intent_task_comp.appropriateFor.extend([parent_ctx, teacher_ctx])

        intent_incomplete_task = onto.IncompleteTaskReport("intent_IncompleteTask")
        intent_incomplete_task.appropriateFor.extend([parent_ctx, teacher_ctx])

        intent_polite_req = onto.PoliteRequest("intent_PoliteRequest")
        intent_polite_req.appropriateFor.extend([parent_ctx, teacher_ctx, peer_ctx])

        intent_polite_interr = onto.PoliteInterruption("intent_PoliteInterruption")
        intent_polite_interr.appropriateFor.extend([parent_ctx, teacher_ctx])

        intent_context_req = onto.ContextualRequest("intent_ContextualRequest")
        intent_context_req.appropriateFor.extend([parent_ctx, teacher_ctx])

        intent_safety_refusal = onto.SafetyRefusal("intent_SafetyRefusal")
        intent_safety_refusal.appropriateFor.extend([stranger_ctx])

        intent_uncertainty = onto.UncertaintyResponse("intent_Uncertainty")
        intent_uncertainty.appropriateFor.extend([stranger_ctx, teacher_ctx])

        intent_social_accept = onto.PeerInvitationAcceptance("intent_SocialAcceptance")
        intent_social_accept.appropriateFor.extend([peer_ctx])
        intent_social_accept.violates.extend([stranger_ctx])

        intent_stranger_comply = onto.StrangerCompliance("intent_StrangerCompliance")
        intent_stranger_comply.violates.extend([stranger_ctx])

        intent_polite_refusal = onto.PoliteRefusal("intent_PoliteRefusal")
        intent_polite_refusal.appropriateFor.extend([peer_ctx, parent_ctx, teacher_ctx])

        intent_coop_sugg = onto.CooperativeSuggestion("intent_CooperativeSuggestion")
        intent_coop_sugg.appropriateFor.extend([peer_ctx])

        intent_hostile = onto.HostileRefusal("intent_HostileRefusal")
        intent_hostile.violates.extend([peer_ctx, parent_ctx, teacher_ctx])

        intent_disrespect = onto.DisrespectfulInformal("intent_DisrespectfulInformal")
        intent_disrespect.violates.extend([teacher_ctx, parent_ctx])

        # 7. Linguistic Feature Individuals
        feat_honorific = onto.HonorificMarker("feat_HonorificMarker")
        feat_refusal = onto.RefusalMarker("feat_RefusalMarker")
        feat_trusted_adult = onto.TrustedAdultReference("feat_TrustedAdultReference")
        feat_excuse_me = onto.ExcuseMeMarker("feat_ExcuseMeMarker")
        feat_first_person = onto.FirstPersonStateMarker("feat_FirstPersonStateMarker")
        feat_time_ext = onto.TimeExtensionMarker("feat_TimeExtensionMarker")

        # 8. Concrete Communication Scenario Archetypes
        # Scenario: Father Meals (e.g. father_02: "Saaptiya?")
        sc_father_meals = onto.CommunicationScenario("Scenario_Father_Meals")
        sc_father_meals.hasSocialRole = [role_parent]
        sc_father_meals.inSocialContext = [meal_ctx, parent_ctx]
        sc_father_meals.expectsIntent = [intent_answer_q]
        sc_father_meals.allowsAlternativeIntent = [intent_context_req]
        sc_father_meals.violatesScenario = [intent_hostile, intent_disrespect]
        sc_father_meals.requiresFeature = [feat_first_person]

        # Scenario: Father Polite Interruption (e.g. t2_father_02: "Appa is on phone, ask for help")
        sc_father_interr = onto.CommunicationScenario("Scenario_Father_PoliteInterruption")
        sc_father_interr.hasSocialRole = [role_parent]
        sc_father_interr.inSocialContext = [parent_ctx]
        sc_father_interr.expectsIntent = [intent_polite_interr]
        sc_father_interr.allowsAlternativeIntent = [intent_polite_req]
        sc_father_interr.violatesScenario = [intent_hostile]
        sc_father_interr.requiresFeature = [feat_excuse_me]

        # Scenario: Father Chore / Task (e.g. father_01, father_03: "TV off pannuva?")
        sc_father_chore = onto.CommunicationScenario("Scenario_Father_Chore")
        sc_father_chore.hasSocialRole = [role_parent]
        sc_father_chore.inSocialContext = [parent_ctx]
        sc_father_chore.expectsIntent = [intent_task_comp, intent_social_accept]
        sc_father_chore.allowsAlternativeIntent = [intent_context_req, intent_polite_refusal]
        sc_father_chore.violatesScenario = [intent_hostile]

        # Scenario: Stranger Safety Offer (e.g. stranger offering candy/ride)
        sc_stranger_safety = onto.CommunicationScenario("Scenario_Stranger_Safety")
        sc_stranger_safety.hasSocialRole = [role_stranger]
        sc_stranger_safety.inSocialContext = [stranger_ctx]
        sc_stranger_safety.expectsIntent = [intent_safety_refusal]
        sc_stranger_safety.allowsAlternativeIntent = [intent_uncertainty]
        sc_stranger_safety.violatesScenario = [intent_stranger_comply, intent_social_accept]
        sc_stranger_safety.requiresFeature = [feat_refusal, feat_trusted_adult]

        # Scenario: Teacher Greeting / Classroom decorum
        sc_teacher_greet = onto.CommunicationScenario("Scenario_Teacher_Greeting")
        sc_teacher_greet.hasSocialRole = [role_teacher]
        sc_teacher_greet.inSocialContext = [teacher_ctx]
        sc_teacher_greet.expectsIntent = [intent_social_accept, intent_answer_q]
        sc_teacher_greet.violatesScenario = [intent_disrespect, intent_hostile]
        sc_teacher_greet.requiresFeature = [feat_honorific]

        # Scenario: Peer Play & Sharing
        sc_peer_play = onto.CommunicationScenario("Scenario_Peer_Play")
        sc_peer_play.hasSocialRole = [role_peer]
        sc_peer_play.inSocialContext = [peer_ctx]
        sc_peer_play.expectsIntent = [intent_social_accept]
        sc_peer_play.allowsAlternativeIntent = [intent_polite_refusal, intent_coop_sugg]
        sc_peer_play.violatesScenario = [intent_hostile]

    # Save enriched ontology
    onto.save(file=owl_file_path, format="rdfxml")
    print(f"[BuildOntology] Successfully updated {owl_file_path}")

if __name__ == "__main__":
    build_ontology()
