// @ts-check

/**
 * @fileoverview List of blocks to be supported in the compiler compatibility layer.
 * This is only for native blocks. Extensions should not be listed here.
 */

// Please keep these lists alphabetical.

const stacked = [
    'assets_delete',
    'assets_set',
    'assets_write',
    'looks_changestretchby',
    'looks_hideallsprites',
    'looks_sayforsecs',
    'looks_setstretchto',
    'looks_switchbackdroptoandwait',
    'looks_thinkforsecs',
    'motion_align_scene',
    'motion_glidesecstoxy',
    'motion_glideto',
    'motion_goto',
    'motion_pointtowards',
    'motion_scroll_right',
    'motion_scroll_up',
    'sensing_askandwait',
    'sensing_setdragmode',
    'sound_changeeffectby',
    'sound_changevolumeby',
    'sound_cleareffects',
    'sound_play',
    'sound_playuntildone',
    'sound_seteffectto',
    'sound_setvolumeto',
    'sound_stopallsounds'
];

const inputs = [
    'assets_file_as_type',
    'assets_metadata',
    'motion_xscroll',
    'motion_yscroll',
    'operator_add_extendable',
    'operator_divide_extendable',
    'operator_join_extendable',
    'operator_multiply_extendable',
    'operator_subtract_extendable',
    'sensing_loud',
    'sensing_loudness',
    'sensing_online',
    'sensing_userid',
    'sound_volume'
];

module.exports = {
    stacked,
    inputs
};
