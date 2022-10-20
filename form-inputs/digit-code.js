import FormInput from './base';
import {createElement} from '@neomasterr/utils';
import IMask from 'imask';

function FormInputDigitCode($container, options = {}) {
    options.length = options.length || 4;
    options.name = options.name || 'code';

    const $element = createElement(
        `<div class="Input-digit-code">
            <input type="hidden" name="${options.name}">
            <div class="Input-digit-code__digits">
                ${[...new Array(options.length)].map(() => {
                    return `<div class="Input-digit-code__digit">
                        <input class="js-digitCodeInput" type="tel" maxlength="1" autocomplete="no">
                    </div>`
                }).join('')}
            </div>
        </div>`
    );

    FormInput.call(this, $element, options);

    this.$container = $container;
    this.$container.appendChild(this.$element);
    this.$input = this.$element.querySelector(`input[name="${options.name}"]`);
    this.inputMaskMap = new WeakMap();

    this.getInputs().forEach(($input, index, $inputs) => {
        const $nextInput = $inputs[index + 1];
        const $prevInput = $inputs[index - 1];

        const mask = IMask($input, {
            mask: '0',
        });

        this.inputMaskMap.set($input, mask);

        $input.addEventListener('keydown', this.onKeyDown.bind(this, $input, $nextInput, $prevInput));
        $input.addEventListener('input', this.onInput.bind(this, $input, $nextInput, $prevInput));
        $input.addEventListener('focus', this.onFocus.bind(this, $input));
        $input.addEventListener('paste', this.onPaste.bind(this, $input));
    });
}

// наследование
FormInputDigitCode.prototype = Object.create(FormInput.prototype);

// цепочка прототипов
Object.defineProperty(FormInputDigitCode.prototype, 'constructor', {
    value: FormInputDigitCode,
    writable: true,
    enumerable: false,
});

FormInputDigitCode.prototype.getInputs = function() {
    return [...this.$element.querySelectorAll('.js-digitCodeInput')];
}

/**
 * Фокус в поле, требующее ввода
 * @return {Boolean} false если таких полей нет
 */
FormInputDigitCode.prototype.focus = function() {
    const $inputs = this.getInputs();
    const focused = $inputs.some($input => {
        if (!$input.value.length) {
            $input.focus();
            return true;
        }

        return false;
    });

    if (!focused) {
        $inputs[0].focus();
    }

    return focused;
}

FormInputDigitCode.prototype.onKeyDown = function($input, $nextInput, $prevInput, e) {
    if (e.key == 'Backspace' && !$input.value.length && $prevInput) {
        $prevInput.focus();
    }

    if (e.key == 'ArrowLeft' && !$input.selectionStart && $prevInput) {
        $prevInput.focus();
    }

    if (e.key == 'ArrowRight' && $input.selectionStart == $input.value.length && $nextInput) {
        $nextInput.focus();
    }
}

FormInputDigitCode.prototype.onInput = function($input, $nextInput, $prevInput, e) {
    if (e.data && /^[0-9]$/.test(e.data) && $nextInput) {
        $nextInput.focus();
    }

    this._emitOnChange();
}

FormInputDigitCode.prototype.onFocus = function($input) {
    $input.select();
}

FormInputDigitCode.prototype.onPaste = function($input, e) {
    const value = (e.clipboardData || window.clipboardData).getData('text');
    this.setValue(value);
}

FormInputDigitCode.prototype.getValue = function() {
    return this.getInputs().map($input => $input.value).join('');
}

FormInputDigitCode.prototype.setValue = function(value) {
    const parts = (value || '').toString().split('').slice(0, this.options.length);
    const $inputs = this.getInputs();

    $inputs.forEach(($input, index) => {
        const mask = this.inputMaskMap.get($input);
        mask.value = parts[index] || '';
    });

    this._emitOnChange();
}

FormInputDigitCode.prototype._emitOnChange = function() {
    this.$input.value = this.getValue();
    this.emit('change', this.$input.value);
}

FormInputDigitCode.prototype.getName = function() {
    return this.$input.name;
}

FormInputDigitCode.prototype.setError = function(text) {
    FormInput.prototype.setError.call(this, text);
    this.getInputs().forEach($input => {
        $input.classList.add('is-error');
    });
}

FormInputDigitCode.prototype.resetError = function() {
    FormInput.prototype.resetError.call(this);
    this.getInputs().forEach($input => {
        $input.classList.remove('is-error');
    });
}

FormInputDigitCode.prototype.validate = function() {
    return this.getValue().length == this.options.length;
}

FormInputDigitCode.prototype.getDisabled = function() {
    return this.$input.disabled;
}

FormInputDigitCode.prototype.setDisabled = function(disabled) {
    this.$input.disabled = disabled;

    this.getInputs().forEach($input => {
        $input.disabled = disabled;
    });

    this.setState('disabled', disabled);
}

export default FormInputDigitCode;
