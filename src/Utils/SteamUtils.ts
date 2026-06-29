import { toaster } from "@decky/api";

export class SteamUtils {
  static notify(title: string, message: string, playSound: boolean = true, duration: number = 3000) {
    try {
      toaster.toast({
        title,
        body: message,
        playSound,
        duration
      });
    } catch (e) {
      console.error("[Gurren] Failed to display toast notification:", e);
    }
  }
}

export class SteamCssVariables {
  static basicuiHeaderHeight = "var(--basicui-header-height)";
  static stickyHeaderBackgroundOpacity = "var(--sticky-header-background-opacity)";
  static gamepadPageContentMaxWidth = "var(--gamepad-page-content-max-width)";
  static scrollFadeSize = "var(--scroll-fade-size)";
  
  static virtualmenuAccent = "var(--virtualmenu-accent)";
  static virtualmenuBg = "var(--virtualmenu-bg)";
  static virtualmenuBgHover = "var(--virtualmenu-bg-hover)";
  static virtualmenuFg = "var(--virtualmenu-fg)";
  static virtualmenutouchkeyIconWidth = "var(--virtualmenutouchkey-icon-width)";
  static virtualmenutouchkeyIconHeight = "var(--virtualmenutouchkey-icon-height)";
  static virtualmenupointerX = "var(--virtualmenupointer-x)";
  static virtualmenupointerY = "var(--virtualmenupointer-y)";
  static virtualmenupointerColor = "var(--virtualmenupointer-color)";
  static virtualmenutouchkeyMidpointX = "var(--virtualmenutouchkey-midpoint-x)";
  static virtualmenutouchkeyMidpointY = "var(--virtualmenutouchkey-midpoint-y)";
  static virtualmenutouchkeyDescriptionWidth = "var(--virtualmenutouchkey-description-width)";

  static touchmenuiconFg = "var(--touchmenuicon-fg)";
  static touchmenuiconBg = "var(--touchmenuicon-bg)";
  static touchmenuiconScale = "var(--touchmenuicon-scale)";

  static indentLevel = "var(--indent-level)";
  static fieldNegativeHorizontalMargin = "var(--field-negative-horizontal-margin)";
  static fieldRowChildrenSpacing = "var(--field-row-children-spacing)";

  static mainTextColor = "var(--main-text-color)";
  static mainLightBlueBackground = "var(--main-light-blue-background)";
  static mainTextOnLightBlue = "var(--main-text-on-light-blue)";
  static mainTopImageBg = "var(--main-top-image-bg)";
  static mainEditorBgColor = "var(--main-editor-bg-color)";
  static mainEditorTextColor = "var(--main-editor-text-color)";
  static mainEditorInputBgColor = "var(--main-editor-input-bg-color)";
  static mainEditorSectionTitleColor = "var(--main-editor-section-title-color)";

  static gpSystemLightestGrey = "var(--gpSystemLightestGrey)";
  static gpSystemLighterGrey = "var(--gpSystemLighterGrey)";
  static gpSystemLightGrey = "var(--gpSystemLightGrey)";
  static gpSystemGrey = "var(--gpSystemGrey)";
  static gpSystemDarkGrey = "var(--gpSystemDarkGrey)";
  static gpSystemDarkerGrey = "var(--gpSystemDarkerGrey)";
  static gpSystemDarkestGrey = "var(--gpSystemDarkestGrey)";
  static gpStoreLightestGrey = "var(--gpStoreLightestGrey)";
  static gpStoreLighterGrey = "var(--gpStoreLighterGrey)";
  static gpStoreLightGrey = "var(--gpStoreLightGrey)";
  static gpStoreGrey = "var(--gpStoreGrey)";
  static gpStoreDarkGrey = "var(--gpStoreDarkGrey)";
  static gpStoreDarkerGrey = "var(--gpStoreDarkerGrey)";
  static gpStoreDarkestGrey = "var(--gpStoreDarkestGrey)";
  static gpGradientStoreBackground = "var(--gpGradient-StoreBackground)";
  static gpGradientLibraryBackground = "var(--gpGradient-LibraryBackground)";
  
  static gpColorBlue = "var(--gpColor-Blue)";
  static gpColorBlueHi = "var(--gpColor-BlueHi)";
  static gpColorGreen = "var(--gpColor-Green)";
  static gpColorGreenHi = "var(--gpColor-GreenHi)";
  static gpColorOrange = "var(--gpColor-Orange)";
  static gpColorRed = "var(--gpColor-Red)";
  static gpColorRedHi = "var(--gpColor-RedHi)";
  static gpColorDustyBlue = "var(--gpColor-DustyBlue)";
  static gpColorLightBlue = "var(--gpColor-LightBlue)";
  static gpColorYellow = "var(--gpColor-Yellow)";
  static gpColorChalkyBlue = "var(--gpColor-ChalkyBlue)";
  
  static gpBackgroundLightSofter = "var(--gpBackground-LightSofter)";
  static gpBackgroundLightSoft = "var(--gpBackground-LightSoft)";
  static gpBackgroundLightMedium = "var(--gpBackground-LightMedium)";
  static gpBackgroundLightHard = "var(--gpBackground-LightHard)";
  static gpBackgroundLightHarder = "var(--gpBackground-LightHarder)";
  static gpBackgroundDarkSofter = "var(--gpBackground-DarkSofter)";
  static gpBackgroundDarkSoft = "var(--gpBackground-DarkSoft)";
  static gpBackgroundDarkMedium = "var(--gpBackground-DarkMedium)";
  static gpBackgroundDarkHard = "var(--gpBackground-DarkHard)";
  
  static gpBackgroundNeutralLightSofter = "var(--gpBackground-Neutral-LightSofter)";
  static gpBackgroundNeutralLightSoft = "var(--gpBackground-Neutral-LightSoft)";
  static gpBackgroundNeutralLightMedium = "var(--gpBackground-Neutral-LightMedium)";
  static gpBackgroundNeutralLightHard = "var(--gpBackground-Neutral-LightHard)";
  static gpBackgroundNeutralLightHarder = "var(--gpBackground-Neutral-LightHarder)";
  
  static gpCornerSmall = "var(--gpCorner-Small)";
  static gpCornerMedium = "var(--gpCorner-Medium)";
  static gpCornerLarge = "var(--gpCorner-Large)";
  
  static gpSpaceGutter = "var(--gpSpace-Gutter)";
  static gpSpaceGap = "var(--gpSpace-Gap)";
  static gpNavWidth = "var(--gpNavWidth)";

  // Custom colors matching autoflatpaks style
  static customTransparent = "#fff0";
  static customStatusGreen = "#0b6f4c";
  static customStatusYellow = "#9c8f40";
  static customStatusRed = "#7a0a0a";
  static customSpinnerBgColor = "#0c1519";
}
