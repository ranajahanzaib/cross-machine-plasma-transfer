"""Research protocols and strict leakage prevention for Cross-Machine Plasma Transfer."""

from enum import Enum
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, Field


class ResearchProtocol(str, Enum):
    """Explicitly separated research protocols.

    Protocol A: Strict source-only transfer. Trained exclusively on DIII-D, zero target fitting.
    Protocol B: Challenge-compatible label-free adaptation. Allows unlabelled MAST inputs/geometry.
                Strictly prohibits target labels or label-derived priors.
    Protocol C: Independent labelled MAST research. Isolated research using FAIR-MAST Level 2.
    """
    PROTOCOL_A = "protocol_a"  # Strict source-only
    PROTOCOL_B = "protocol_b"  # Challenge-compatible label-free
    PROTOCOL_C = "protocol_c"  # Independent labelled MAST research


class ProtocolViolationError(Exception):
    """Raised when an operation violates the active research protocol or causes target leakage."""
    pass


class LineageRecord(BaseModel):
    """Auditable lineage for any dataset, feature, or model artifact."""
    artifact_id: str
    protocol: ResearchProtocol
    source_machines: List[str]
    has_target_labels: bool = False
    fitted_on_target: bool = False
    forbidden_features_used: List[str] = Field(default_factory=list)
    parent_artifacts: List[str] = Field(default_factory=list)
    description: str = ""


class ProtocolGuard:
    """Enforces scientific boundaries and prevents target-label / feature leakage."""

    # Features and columns strictly prohibited from entering challenge-compatible feature generation (Protocols A & B)
    FORBIDDEN_PREDICTION_INPUTS: Set[str] = {
        "magnetics_dsep",  # Scaffolding / context only; D3D & MAST mean physically different quantities
        "efit_psirz",
        "efit_q95",
        "efit_beta_n",
        "efit_li",
        "efit_r_axis",
        "efit_z_axis",
        "efit_lcfs_n",
        "efit_lcfs_r",
        "efit_lcfs_z",
        "efit_beta_p",
        "efit_elongation",
        "efit_psi_axis",
        "efit_psi_boundary",
        "efit_geom_axis_r",
        "efit_geom_axis_z",
    }

    @classmethod
    def validate_feature_columns(cls, protocol: ResearchProtocol, columns: List[str]) -> None:
        """Verify no target-derived or forbidden context columns are included in feature matrices."""
        forbidden_present = [c for c in columns if c in cls.FORBIDDEN_PREDICTION_INPUTS]
        if forbidden_present:
            raise ProtocolViolationError(
                f"Protocol {protocol.value} violation: Forbidden columns present in feature matrix: {forbidden_present}. "
                f"These columns represent target labels or misleading context (e.g. magnetics_dsep)."
            )

    @classmethod
    def validate_training_data(
        cls,
        protocol: ResearchProtocol,
        machine: str,
        has_labels: bool,
        is_target: bool = False,
    ) -> None:
        """Validate whether training data meets the constraints of the active protocol."""
        if protocol == ResearchProtocol.PROTOCOL_A:
            if is_target or machine.lower() in ("mast", "mast_u"):
                raise ProtocolViolationError(
                    "Protocol A violation: Target machine (MAST) data cannot be used during training "
                    "or preprocessing fitting in strict source-only transfer."
                )
        elif protocol == ResearchProtocol.PROTOCOL_B:
            if is_target and has_labels:
                raise ProtocolViolationError(
                    "Protocol B violation: Target machine (MAST) labels cannot be used for training, "
                    "validation, fine-tuning, or model selection under Challenge-compatible adaptation."
                )
        elif protocol == ResearchProtocol.PROTOCOL_C:
            # Protocol C allows independent labelled MAST experiments, but requires isolated namespace
            pass

    @classmethod
    def validate_split_integrity(
        cls,
        train_shots: Set[str],
        val_shots: Set[str],
        test_shots: Optional[Set[str]] = None,
    ) -> None:
        """Ensure no shot contamination between splits (group-aware split integrity)."""
        train_val_overlap = train_shots.intersection(val_shots)
        if train_val_overlap:
            raise ProtocolViolationError(
                f"Data split integrity violation: {len(train_val_overlap)} shots appear in both train and validation splits: {list(train_val_overlap)[:5]}"
            )
        if test_shots:
            train_test_overlap = train_shots.intersection(test_shots)
            if train_test_overlap:
                raise ProtocolViolationError(
                    f"Data split integrity violation: {len(train_test_overlap)} shots appear in both train and test splits: {list(train_test_overlap)[:5]}"
                )
            val_test_overlap = val_shots.intersection(test_shots)
            if val_test_overlap:
                raise ProtocolViolationError(
                    f"Data split integrity violation: {len(val_test_overlap)} shots appear in both validation and test splits: {list(val_test_overlap)[:5]}"
                )

    @classmethod
    def validate_adaptation_method(
        cls,
        protocol: ResearchProtocol,
        adaptation_name: str,
        requires_target_labels: bool = False,
    ) -> None:
        """Validate whether the adaptation method is permissible under the active protocol."""
        if protocol == ResearchProtocol.PROTOCOL_A:
            if adaptation_name != "none":
                raise ProtocolViolationError(
                    f"Protocol A requires no adaptation (adaptation='none'), but got '{adaptation_name}'."
                )
        elif protocol == ResearchProtocol.PROTOCOL_B:
            if requires_target_labels:
                raise ProtocolViolationError(
                    f"Protocol B prohibits target-labelled adaptation '{adaptation_name}'. "
                    f"Only unlabelled alignment (CORAL, MMD, DANN, Optimal Transport, TTA) is allowed."
                )

    @classmethod
    def audit_experiment_provenance(
        cls,
        protocol: ResearchProtocol,
        lineage: LineageRecord,
    ) -> Dict[str, Any]:
        """Perform a full compliance audit on an experiment's lineage."""
        issues: List[str] = []
        is_compliant = True

        if protocol in (ResearchProtocol.PROTOCOL_A, ResearchProtocol.PROTOCOL_B):
            if lineage.has_target_labels:
                issues.append("Artifact incorporates target machine labels in a challenge protocol.")
                is_compliant = False

        if protocol == ResearchProtocol.PROTOCOL_A and lineage.fitted_on_target:
            issues.append("Artifact has fitted parameters on target machine data under Protocol A.")
            is_compliant = False

        if lineage.forbidden_features_used:
            issues.append(f"Forbidden features detected: {lineage.forbidden_features_used}")
            is_compliant = False

        return {
            "protocol": protocol.value,
            "artifact_id": lineage.artifact_id,
            "is_compliant": is_compliant,
            "issues": issues,
            "has_target_labels": lineage.has_target_labels,
            "fitted_on_target": lineage.fitted_on_target,
            "source_machines": lineage.source_machines,
        }
