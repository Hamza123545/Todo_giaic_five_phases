"""
RRULE Parser - Phase V

Parses RRULE patterns and calculates next occurrences for recurring tasks.
Supports simplified patterns (DAILY, WEEKLY, MONTHLY, YEARLY) and full RFC 5545 RRULE strings.

Based on: .claude/skills/rrule-recurring-tasks
"""

from datetime import datetime, timezone, timedelta
from typing import Optional, Literal
from dateutil.rrule import rrule, rrulestr, DAILY, WEEKLY, MONTHLY, YEARLY
from dateutil.parser import parse as parse_datetime
import logging

logger = logging.getLogger(__name__)


class RRuleParser:
    """
    Parse RRULE patterns and calculate next occurrences.

    Supports:
    - Simplified patterns: DAILY, WEEKLY, MONTHLY, YEARLY
    - Full RFC 5545 RRULE strings (e.g., "FREQ=DAILY;INTERVAL=1;COUNT=10")
    - UTC-only time handling (no timezone conversions)
    - recurring_end_date support

    Usage:
        parser = RRuleParser()

        # Simplified pattern
        next_occ = parser.calculate_next("DAILY", datetime.utcnow())

        # Full RRULE
        next_occ = parser.calculate_next("FREQ=WEEKLY;BYDAY=MO,WE,FR", datetime.utcnow())
    """

    # Simplified pattern mapping (pattern -> dateutil.rrule frequency)
    SIMPLIFIED_PATTERNS = {
        "DAILY": DAILY,
        "WEEKLY": WEEKLY,
        "MONTHLY": MONTHLY,
        "YEARLY": YEARLY
    }

    def parse_pattern(self, pattern: str) -> rrule:
        """
        Parse RRULE pattern (simplified or full RFC 5545).

        Args:
            pattern: RRULE pattern string
                - Simplified: "DAILY", "WEEKLY", "MONTHLY", "YEARLY"
                - Full RFC 5545: "FREQ=DAILY;INTERVAL=1", "FREQ=WEEKLY;BYDAY=MO,WE,FR", etc.

        Returns:
            dateutil.rrule.rrule object

        Raises:
            ValueError: If pattern is invalid or unparseable

        Examples:
            >>> parser = RRuleParser()
            >>> rule = parser.parse_pattern("DAILY")  # Simplified
            >>> rule = parser.parse_pattern("FREQ=WEEKLY;BYDAY=MO,WE,FR")  # Full RFC 5545
        """
        pattern_upper = pattern.upper().strip()

        # Check if simplified pattern (DAILY, WEEKLY, MONTHLY, YEARLY)
        if pattern_upper in self.SIMPLIFIED_PATTERNS:
            freq = self.SIMPLIFIED_PATTERNS[pattern_upper]
            # Return rrule with frequency, interval=1 (no dtstart yet - set in calculate_next)
            return rrule(freq, interval=1, dtstart=datetime.now(timezone.utc).replace(tzinfo=None))

        # Full RRULE string - try parsing
        # Accept both "FREQ=..." and "RRULE:FREQ=..." formats
        if pattern.startswith("RRULE:"):
            rrule_string = pattern
        else:
            # Assume FREQ= format, wrap with RRULE:
            rrule_string = f"RRULE:{pattern}"

        try:
            # Parse RRULE string (dateutil handles RFC 5545 syntax)
            # dtstart will be set to current time if not in string
            rule = rrulestr(rrule_string, dtstart=datetime.now(timezone.utc).replace(tzinfo=None))
            return rule
        except Exception as e:
            raise ValueError(f"Invalid RRULE pattern '{pattern}': {e}")

    def calculate_next(
        self,
        pattern: str,
        dtstart: datetime,
        end_date: Optional[datetime] = None
    ) -> Optional[datetime]:
        """
        Calculate next occurrence from pattern.

        Args:
            pattern: RRULE pattern (simplified or full RFC 5545)
            dtstart: Start date for calculation (UTC naive datetime)
            end_date: Optional recurring end date (UTC naive datetime)

        Returns:
            Next occurrence as UTC naive datetime, or None if:
            - End date reached
            - No more occurrences (COUNT exhausted)
            - Invalid pattern

        Raises:
            ValueError: If pattern is invalid

        Examples:
            >>> parser = RRuleParser()
            >>> now = datetime(2025, 12, 29, 10, 0, 0)  # UTC
            >>> next_occ = parser.calculate_next("DAILY", now)
            # Returns: datetime(2025, 12, 30, 10, 0, 0)  # Next day at 10am UTC

            >>> # With end date
            >>> end = datetime(2026, 1, 31, 23, 59, 59)  # Stop at end of January 2026
            >>> next_occ = parser.calculate_next("WEEKLY", now, end_date=end)
        """
        # Ensure dtstart is naive UTC (no timezone info)
        if dtstart.tzinfo is not None:
            dtstart = dtstart.replace(tzinfo=None)

        # Ensure end_date is naive UTC (no timezone info)
        if end_date and end_date.tzinfo is not None:
            end_date = end_date.replace(tzinfo=None)

        try:
            # Parse pattern
            rule = self.parse_pattern(pattern)

            # Set dtstart (overrides default from parse_pattern)
            rule._dtstart = dtstart

            # Get next occurrence after dtstart
            # Use .after() to get first occurrence AFTER dtstart (not including dtstart itself)
            next_occurrence = rule.after(dtstart, inc=False)

            if next_occurrence is None:
                logger.debug(f"No next occurrence for pattern '{pattern}' after {dtstart}")
                return None

            # Check if past end date
            if end_date and next_occurrence > end_date:
                logger.debug(f"Next occurrence {next_occurrence} is past end date {end_date}")
                return None

            # Ensure next_occurrence is naive UTC (dateutil may add timezone)
            if next_occurrence.tzinfo is not None:
                next_occurrence = next_occurrence.replace(tzinfo=None)

            logger.debug(f"Next occurrence calculated: {next_occurrence} (pattern: {pattern}, dtstart: {dtstart})")
            return next_occurrence

        except Exception as e:
            logger.error(f"Error calculating next occurrence: {e}", exc_info=True)
            raise ValueError(f"Failed to calculate next occurrence: {e}")

    def validate_pattern(self, pattern: str) -> bool:
        """
        Validate RRULE pattern without calculating occurrences.

        Args:
            pattern: RRULE pattern to validate

        Returns:
            True if pattern is valid, False otherwise

        Examples:
            >>> parser = RRuleParser()
            >>> parser.validate_pattern("DAILY")  # True
            >>> parser.validate_pattern("FREQ=INVALID;INTERVAL=1")  # False
        """
        try:
            self.parse_pattern(pattern)
            return True
        except Exception:
            return False


# Singleton instance for reuse
_rrule_parser: Optional[RRuleParser] = None


def get_rrule_parser() -> RRuleParser:
    """
    Get singleton RRuleParser instance.

    Returns:
        RRuleParser instance

    Usage:
        from phase_5.backend.src.integrations.rrule_parser import get_rrule_parser

        parser = get_rrule_parser()
        next_occ = parser.calculate_next("DAILY", datetime.utcnow())
    """
    global _rrule_parser
    if _rrule_parser is None:
        _rrule_parser = RRuleParser()
    return _rrule_parser
